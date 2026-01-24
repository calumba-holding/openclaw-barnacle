import {
	ApplicationCommandOptionType,
	Container,
	type CommandInteraction,
	LinkButton,
	Section,
	Separator,
	TextDisplay,
	Thumbnail
} from "@buape/carbon"
import BaseCommand from "./base.js"

type GitHubIssue = {
	html_url: string
	number: number
	title?: string
	state?: string
	user?: {
		login?: string
		avatar_url?: string
	}
	labels?: Array<{ name?: string }>
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
					new Container(
						[new TextDisplay(`Couldn’t reach GitHub for ${repoName}.`)],
						{ accentColor: "#f85149" }
					)
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
				components: [
					new Container([new TextDisplay(message)], { accentColor: "#f85149" })
				]
			})
			return
		}

		const issue = (await response.json()) as GitHubIssue
		const isPullRequest = Boolean(issue.pull_request)
		const typeLabel = isPullRequest ? "Pull request" : "Issue"
		const title = issue.title ?? "Untitled"
		const state = issue.state ?? "unknown"
		const author = issue.user?.login ?? "unknown"
		const labels = issue.labels?.map((label) => label.name).filter(Boolean) ?? []
		const avatarUrl =
			issue.user?.avatar_url ??
			"https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
		const accentColor = isPullRequest
			? "#a371f7"
			: state === "open"
				? "#3fb950"
				: "#f85149"
		const labelsDisplay = labels.length > 0 ? labels.join(", ") : "None"

		await interaction.reply({
			components: [
				new Container(
					[
						new Section(
							[
								new TextDisplay(`**${typeLabel} #${issue.number}**`),
								new TextDisplay(title),
								new TextDisplay(`Repo: ${repoName}`)
							],
							new Thumbnail(avatarUrl)
						),
						new Separator({ divider: true, spacing: "small" }),
						new TextDisplay(`State: **${state}**`),
						new TextDisplay(`Author: **${author}**`),
						new TextDisplay(`Labels: ${labelsDisplay}`),
						new Section(
							[new TextDisplay("Open on GitHub")],
							new GitHubLinkButton(issue.html_url)
						)
					],
					{ accentColor }
				)
			]
		})
	}
}
