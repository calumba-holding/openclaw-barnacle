import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	Container,
	type CommandInteraction,
	InteractionContextType,
	TextDisplay
} from "@buape/carbon"
import BaseCommand from "./base.js"
import {
	buildGitHubSummaryContainer,
	fetchGitHubSummaryData
} from "../utils/githubSummary.js"

export default class GithubCommand extends BaseCommand {
	name = "github"
	description = "Summarize a GitHub issue or pull request"
	integrationTypes = [
		ApplicationIntegrationType.GuildInstall,
		ApplicationIntegrationType.UserInstall
	]
	contexts = [InteractionContextType.Guild, InteractionContextType.BotDM]
	options = [
		{
			name: "number",
			description: "Issue or pull request number",
			type: ApplicationCommandOptionType.Integer as const,
			required: true
		},
		{
			name: "user",
			description: "Repository owner (default: openclaw)",
			type: ApplicationCommandOptionType.String as const
		},
		{
			name: "repo",
			description: "Repository name (default: openclaw)",
			type: ApplicationCommandOptionType.String as const
		}
	]

	async run(interaction: CommandInteraction) {
		const number = interaction.options.getInteger("number", true)
		const owner = interaction.options.getString("user") ?? "openclaw"
		const repo = interaction.options.getString("repo") ?? "openclaw"
		const data = await fetchGitHubSummaryData(owner, repo, number).catch(() => null)

		if (!data) {
			await interaction.reply({
				components: [
					new Container([
						new TextDisplay(`Couldn’t find issue or pull request #${number} in ${owner}/${repo}.`)
					], { accentColor: "#f85149" })
				]
			})
			return
		}

		await interaction.reply({
			components: [buildGitHubSummaryContainer(data)]
		})
	}
}
