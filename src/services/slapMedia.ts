import type {
	MessagePayloadFile,
	MessagePayloadObject
} from "@buape/carbon"
import {
	buildSlapIncidentContainer,
	type SlapIncidentMedia
} from "../components/slapButtons.js"
import type { SlapEvent } from "../db/schema.js"
import { formatSlapIncidentId } from "./slapEngine.js"

export type SlapImageFetcher = (
	input: RequestInfo | URL,
	init?: RequestInit
) => Promise<Response>

let configuredFetcher: SlapImageFetcher | null = null

export const setSlapImageFetcherForTesting = (
	fetcher: SlapImageFetcher | null
) => {
	configuredFetcher = fetcher
}

const trustedImageOrigin = "https://raw.githubusercontent.com"
const trustedImagePathPrefix = "/openclaw/hermit/"
const maximumImageBytes = 1024 * 1024

const isWebp = (bytes: Uint8Array) =>
	bytes.length >= 12 &&
	String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
	String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP"

const fetchImageFile = async (
	url: string,
	name: string,
	description: string,
	fetcher: SlapImageFetcher
): Promise<MessagePayloadFile> => {
	const parsed = new URL(url)
	if (
		parsed.origin !== trustedImageOrigin ||
		!parsed.pathname.startsWith(trustedImagePathPrefix)
	) {
		throw new Error("Refusing to fetch an untrusted slap image URL")
	}

	const response = await fetcher(parsed, {
		headers: { accept: "image/webp" }
	})
	if (!response.ok) {
		throw new Error(`Slap image fetch failed with HTTP ${response.status}`)
	}

	const bytes = new Uint8Array(await response.arrayBuffer())
	if (!isWebp(bytes) || bytes.length > maximumImageBytes) {
		throw new Error("Slap image response was not a valid bounded WebP")
	}

	return {
		name,
		data: new Blob([bytes], { type: "image/webp" }),
		description
	}
}

export const buildSlapIncidentPayload = async (
	event: SlapEvent,
	fetcher: SlapImageFetcher = configuredFetcher ?? fetch
): Promise<MessagePayloadObject> => {
	const incidentId = formatSlapIncidentId(event.id)
	const files: MessagePayloadFile[] = []
	const media: SlapIncidentMedia = {
		imageUrl: null,
		counterImageUrl: event.counterImageUrl ? null : undefined
	}

	try {
		const name = `slap-${event.id}-initial.webp`
		files.push(
			await fetchImageFile(
				event.imageUrl,
				name,
				`${event.fishName}, assigned to ${incidentId}`,
				fetcher
			)
		)
		media.imageUrl = `attachment://${name}`
	} catch (error) {
		console.error(`Failed to attach slap image for event ${event.id}:`, error)
	}

	if (event.counterImageUrl && event.counterFishName) {
		try {
			const name = `slap-${event.id}-counter.webp`
			files.push(
				await fetchImageFile(
					event.counterImageUrl,
					name,
					`${event.counterFishName}, deployed as the counter-filing for ${incidentId}`,
					fetcher
				)
			)
			media.counterImageUrl = `attachment://${name}`
		} catch (error) {
			console.error(
				`Failed to attach counter-slap image for event ${event.id}:`,
				error
			)
		}
	}

	return {
		components: [buildSlapIncidentContainer(event, media)],
		...(files.length > 0 ? { files } : {})
	}
}
