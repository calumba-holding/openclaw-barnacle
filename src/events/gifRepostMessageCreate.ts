import {
	MessageCreateListener,
	type Client,
	type ListenerEventData,
	Routes
} from "@buape/carbon"
import { getOrCreateChannelWebhook, sendWebhookMessage } from "../utils/channelWebhook.js"

const gifLinkDomains = new Set(["tenor.com", "klipy.com"])
const urlRegex = /https?:\/\/[^\s<>()]+/gi

const trimUrl = (url: string) => url.replace(/[.,!?;:]+$/, "")

const findGifLink = (content: string) => {
	for (const match of content.matchAll(urlRegex)) {
		const link = trimUrl(match[0])
		try {
			const hostname = new URL(link).hostname.toLowerCase()
			const rootDomain = hostname.split(".").slice(-2).join(".")
			if (gifLinkDomains.has(rootDomain)) {
				return link
			}
		} catch {
			continue
		}
	}
	return null
}

export default class GifRepostMessageCreate extends MessageCreateListener {
	async handle(data: ListenerEventData[this["type"]], client: Client) {
		if (!data.channel_id || data.webhook_id || data.author.bot) {
			return
		}

		const gifLink = findGifLink(data.content)
		if (!gifLink) {
			return
		}

		try {
			const webhook = await getOrCreateChannelWebhook(client, data.channel_id)
			await client.rest.delete(Routes.channelMessage(data.channel_id, data.id))
			await sendWebhookMessage(webhook, {
				content: gifLink,
				username:
					data.member?.nickname ||
					data.author.globalName ||
					data.author.username ||
					data.author.id,
				avatar_url: data.member?.avatarUrl || data.author.avatarUrl || undefined
			})
		} catch (error) {
			console.error("Failed to repost GIF link:", error)
		}
	}
}
