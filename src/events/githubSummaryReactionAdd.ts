import {
	MessageReactionAddListener,
	type Client,
	type ListenerEventData
} from "@buape/carbon"
import {
	buildGitHubSummaryContainer,
	fetchGitHubSummaryData,
	parseGitHubIssueUrl
} from "../utils/githubSummary.js"

const summaryEmojiId = "1478966151743672563"

export default class GithubSummaryReactionAdd extends MessageReactionAddListener {
	async handle(data: ListenerEventData[this["type"]], client: Client) {
		if (data.emoji.id !== summaryEmojiId || data.user.bot) {
			return
		}

		const message = data.message.partial ? await data.message.fetch() : data.message
		const source = [
			message.content,
			...(message.embeds ?? []).flatMap((embed: { url?: string; title?: string; description?: string }) => [
				embed.url,
				embed.title,
				embed.description
			])
		]
			.filter(Boolean)
			.join("\n")
		const match = parseGitHubIssueUrl(source)
		if (!match) {
			return
		}

		const summary = await fetchGitHubSummaryData(
			match.owner,
			match.repo,
			match.number
		).catch(() => null)
		if (!summary) {
			return
		}

		const channel = await client.fetchChannel(data.channel_id)
		if (channel && "send" in channel) {
			await channel.send({
				components: [buildGitHubSummaryContainer(summary)]
			})
		}
	}
}
