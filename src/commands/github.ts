import {
	ApplicationCommandOptionType,
	type CommandInteraction,
	LinkButton,
	Section,
	TextDisplay
} from "@buape/carbon"
import BaseCommand from "./base.js"

type GitHubIssue = {
	html_url: string
	number: number
	title?: string
	state?: string
	pull_request?: {
		url: string
	}
}

class GitHubLinkButton extends LinkButton {
	label = "Open on GitHub"
	url: string

	constructor(url: string) {
		super()
		this.url = url
	}
}

export default class GithubCommand extends BaseCommand {
	name = "github"
	description = "Find a GitHub issue or pull request"
	options = [
		{
			name: "number",
			description: "Issue or pull request number",
			type: ApplicationCommandOptionType.Integer,
			required: true
		},
		{
			name: "user",
			description: "Repository owner (default: clawdbot)",
			type: ApplicationCommandOptionType.String
		},
		{
			name: "repo",
			description: "Repository name (default: clawdbot)",
			type: ApplicationCommandOptionType.String
		}
	]

	async run(interaction: CommandInteraction) {
		const number = interaction.options.getInteger("number", true)
		const owner = interaction.options.getString("user") ?? "clawdbot"
		const repo = interaction.options.getString("repo") ?? "clawdbot"
		const repoName = `${owner}/${repo}`
		const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${number}`

		let response: Response

		try {
			response = await fetch(apiUrl, {
				headers: {
					Accept: "application/vnd.github+json",
					"User-Agent": "barnacle"
				}
			})
		} catch (error) {
			await interaction.reply({
				components: [
					new TextDisplay(`Failed to reach GitHub for ${repoName}.`)
				]
			})
			return
		}

		if (!response.ok) {
			const message =
				response.status === 404
					? `No issue or pull request #${number} found in ${repoName}.`
					: `GitHub returned ${response.status} for ${repoName}.`

			await interaction.reply({
				components: [new TextDisplay(message)]
			})
			return
		}

		const issue = (await response.json()) as GitHubIssue
		const typeLabel = issue.pull_request ? "Pull request" : "Issue"
		const title = issue.title ?? "No title available"
		const state = issue.state ?? "unknown"

		await interaction.reply({
			components: [
				new Section(
					[
						new TextDisplay(`${typeLabel} #${issue.number} in ${repoName}`),
						new TextDisplay(title),
						new TextDisplay(`State: ${state}`)
					],
					new GitHubLinkButton(issue.html_url)
				)
			]
		})
	}
}
