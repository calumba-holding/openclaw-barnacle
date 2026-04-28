import type { CommandInteraction } from "@buape/carbon"
import { insertEvent, normalizeEventPayload } from "../data/helperLogs.js"

type ThreadStatsChannel = {
	id?: string
	message_count?: number
	messageCount?: number
	total_message_sent?: number
	totalMessageSent?: number
}

type WorkerEventActor = {
	id: string | null
	username: string | null
	globalName: string | null
}

type WorkerEventContext = {
	guildId: string | null
	channelId: string | null
	threadId: string | null
	messageCount: number | null
	parentId?: string | null
}

type WorkerEventPayload<TData> = {
	type: string
	time: string
	invokedBy: WorkerEventActor
	context: WorkerEventContext
	data: TData
}

type SendWorkerEventInput<TData> = {
	type: string
	invokedBy: WorkerEventActor
	context: WorkerEventContext
	data: TData
}

export const postWorkerEvent = async <TData>({
	type,
	invokedBy,
	context,
	data
}: SendWorkerEventInput<TData>) => {
	const payload: WorkerEventPayload<TData> = {
		type,
		time: new Date().toISOString(),
		invokedBy,
		context,
		data
	}

	try {
		const normalizedEvent = normalizeEventPayload(payload)
		if (!normalizedEvent) {
			return
		}

		await insertEvent(normalizedEvent)
	} catch {
		// Ignore event persistence failures so primary flows can continue.
	}
}

export const sendWorkerEvent = async <TData>(
	interaction: CommandInteraction,
	type: string,
	data: TData
) => {
	const rawChannel = interaction.rawData.channel as ThreadStatsChannel | undefined
	const channelId = interaction.rawData.channel_id ?? rawChannel?.id ?? null
	const user = interaction.user
	const messageCount =
		rawChannel?.total_message_sent ??
		rawChannel?.totalMessageSent ??
		rawChannel?.message_count ??
		rawChannel?.messageCount ??
		null
	await postWorkerEvent({
		type,
		invokedBy: {
			id: user?.id ?? null,
			username: user?.username ?? null,
			globalName: user?.globalName ?? null
		},
		context: {
			guildId: interaction.rawData.guild_id ?? null,
			channelId,
			threadId: channelId,
			messageCount
		},
		data
	})
}
