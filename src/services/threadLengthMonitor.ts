import {
	type Client,
	Container,
	GuildThreadChannel,
	TextDisplay
} from "@buape/carbon"
import {
	threadLengthClose200Message,
	threadLengthWarning100Message,
	threadLengthWarning150Message
} from "../config/threadLengthMessages.js"
import {
	listTrackedThreads,
	type TrackedThreadRecord,
	upsertTrackedThread
} from "../utils/trackedThreads.js"

const FIRST_WARNING_THRESHOLD = 100
const SECOND_WARNING_THRESHOLD = 150
const AUTO_CLOSE_THRESHOLD = 200
const DEFAULT_FETCH_LIMIT = 500

let monitorRunInFlight = false

const isThreadLengthMonitorEnabled = () => {
	const rawValue = process.env.THREAD_LENGTH_CHECK_INTERVAL_HOURS?.trim()
	if (!rawValue) {
		return false
	}

	const intervalHours = Number.parseFloat(rawValue)
	if (!Number.isFinite(intervalHours) || intervalHours <= 0) {
		console.warn(
			`THREAD_LENGTH_CHECK_INTERVAL_HOURS must be a positive number. Got "${rawValue}".`
		)
		return false
	}

	return true
}

const getErrorStatus = (error: unknown) => {
	if (!error || typeof error !== "object") {
		return null
	}

	const status = Reflect.get(error, "status")
	if (typeof status === "number") {
		return status
	}

	const statusCode = Reflect.get(error, "statusCode")
	if (typeof statusCode === "number") {
		return statusCode
	}

	const response = Reflect.get(error, "response")
	if (!response || typeof response !== "object") {
		return null
	}

	const responseStatus = Reflect.get(response, "status")
	if (typeof responseStatus === "number") {
		return responseStatus
	}

	const responseStatusCode = Reflect.get(response, "statusCode")
	if (typeof responseStatusCode === "number") {
		return responseStatusCode
	}

	return null
}

const isThreadLikeChannel = (
	channel: unknown
): channel is GuildThreadChannel<any, false> =>
	Boolean(
		channel &&
			typeof channel === "object" &&
			"archive" in channel &&
			typeof channel.archive === "function" &&
			"lock" in channel &&
			typeof channel.lock === "function"
	)

const getMessageCount = (thread: GuildThreadChannel<any, false>) =>
	thread.totalMessageSent ?? thread.messageCount ?? 0

const sendThreadMessage = async (
	thread: GuildThreadChannel<any, false>,
	message: string
) => {
	await thread.send({
		components: [new Container([new TextDisplay(message)])]
	})
}

const syncClosedThread = async (
	trackedThread: TrackedThreadRecord,
	lastMessageCount: number | null
) => {
	await upsertTrackedThread({
		threadId: trackedThread.thread_id,
		createdAt: trackedThread.created_at,
		lastChecked: new Date().toISOString(),
		solved: trackedThread.solved === 1,
		warningLevel: trackedThread.warning_level,
		closed: true,
		lastMessageCount
	})
}

const checkTrackedThread = async (
	client: Client,
	trackedThread: TrackedThreadRecord
) => {
	let channel: Awaited<ReturnType<Client["fetchChannel"]>>

	try {
		channel = await client.fetchChannel(trackedThread.thread_id)
	} catch (error) {
		const status = getErrorStatus(error)
		if (status === 404) {
			await syncClosedThread(trackedThread, trackedThread.last_message_count)
			return
		}

		console.error(
			`Failed to fetch tracked thread ${trackedThread.thread_id} from Discord:`,
			error
		)
		await upsertTrackedThread({
			threadId: trackedThread.thread_id,
			createdAt: trackedThread.created_at,
			lastChecked: new Date().toISOString(),
			solved: trackedThread.solved === 1,
			warningLevel: trackedThread.warning_level,
			closed: trackedThread.closed === 1,
			lastMessageCount: trackedThread.last_message_count
		})
		return
	}

	if (!isThreadLikeChannel(channel)) {
		console.warn(
			`Tracked thread ${trackedThread.thread_id} is missing or is no longer a Discord thread channel.`
		)
		await syncClosedThread(trackedThread, trackedThread.last_message_count)
		return
	}

	const messageCount = getMessageCount(channel)
	const threadIsClosed = Boolean(channel.archived || channel.locked)

	if (threadIsClosed) {
		await syncClosedThread(trackedThread, messageCount)
		return
	}

	const checkedAt = new Date().toISOString()
	let nextWarningLevel = trackedThread.warning_level
	let nextClosed = trackedThread.closed === 1

	if (messageCount > AUTO_CLOSE_THRESHOLD) {
		try {
			await sendThreadMessage(channel, threadLengthClose200Message)
		} catch (error) {
			console.error(
				`Failed to send auto-close warning for thread ${trackedThread.thread_id}:`,
				error
			)
		}

		let archived = false
		let locked = false

		try {
			await channel.archive()
			archived = true
		} catch (error) {
			console.error(
				`Failed to archive thread ${trackedThread.thread_id} during auto-close:`,
				error
			)
		}

		try {
			await channel.lock()
			locked = true
		} catch (error) {
			console.error(
				`Failed to lock thread ${trackedThread.thread_id} during auto-close:`,
				error
			)
		}

		nextClosed = archived || locked
		nextWarningLevel = Math.max(nextWarningLevel, 2)
	} else if (
		messageCount > SECOND_WARNING_THRESHOLD &&
		trackedThread.warning_level < 2
	) {
		try {
			await sendThreadMessage(channel, threadLengthWarning150Message)
			nextWarningLevel = 2
		} catch (error) {
			console.error(
				`Failed to send 150-message warning for thread ${trackedThread.thread_id}:`,
				error
			)
		}
	} else if (
		messageCount > FIRST_WARNING_THRESHOLD &&
		trackedThread.warning_level < 1
	) {
		try {
			await sendThreadMessage(channel, threadLengthWarning100Message)
			nextWarningLevel = 1
		} catch (error) {
			console.error(
				`Failed to send 100-message warning for thread ${trackedThread.thread_id}:`,
				error
			)
		}
	}

	await upsertTrackedThread({
		threadId: trackedThread.thread_id,
		createdAt: trackedThread.created_at,
		lastChecked: checkedAt,
		solved: trackedThread.solved === 1,
		warningLevel: nextWarningLevel,
		closed: nextClosed,
		lastMessageCount: messageCount
	})
}

const runMonitorPass = async (client: Client) => {
	const trackedThreads = await listTrackedThreads({
		solved: false,
		closed: false,
		limit: DEFAULT_FETCH_LIMIT
	})

	for (const trackedThread of trackedThreads) {
		await checkTrackedThread(client, trackedThread)
	}
}

export const runThreadLengthMonitor = async (client: Client) => {
	if (!isThreadLengthMonitorEnabled()) {
		return
	}

	if (monitorRunInFlight) {
		console.log(
			"Skipping thread length monitor pass because the previous pass is still running."
		)
		return
	}

	monitorRunInFlight = true
	try {
		await runMonitorPass(client)
	} catch (error) {
		console.error("Thread length monitor pass failed:", error)
	} finally {
		monitorRunInFlight = false
	}
}
