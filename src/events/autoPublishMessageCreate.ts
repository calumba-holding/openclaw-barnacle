import {
	MessageCreateListener,
	type Client,
	type ListenerEventData,
	Routes
} from "@buape/carbon"
import { MessageFlags } from "discord-api-types/v10"

const autopublishChannelIds = new Set([
	"1457939786659790900",
	"1471735751606534236",
	"1457893269571633285"
])

export default class AutoPublishMessageCreate extends MessageCreateListener {
	async handle(data: ListenerEventData[this["type"]], client: Client) {
		const channelId = data.channel_id

		if (!channelId || !autopublishChannelIds.has(channelId)) {
			return
		}

		if (data.flags && (data.flags & MessageFlags.Crossposted) === MessageFlags.Crossposted) {
			return
		}

		await client.rest
			.post(Routes.channelMessageCrosspost(channelId, data.id), {})
			.catch((error) => {
				console.error("Failed to auto-publish announcement message:", error)
			})
	}
}
