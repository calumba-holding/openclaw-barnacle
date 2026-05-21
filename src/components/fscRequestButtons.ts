import {
	Button,
	type ButtonInteraction,
	ButtonStyle,
	ComponentType,
	Container,
	Row,
	Separator,
	TextDisplay
} from "@buape/carbon"
import {
	buildFscContainer,
	createFscChannel,
	fscCategoryId
} from "../utils/fsc.js"

const collectText = (component: unknown): string[] => {
	if (!component || typeof component !== "object") {
		return []
	}

	const record = component as Record<string, unknown>
	const content = typeof record.content === "string" ? [record.content] : []
	const children = Array.isArray(record.components)
		? record.components.flatMap(collectText)
		: []

	return [...content, ...children]
}

const parseRequest = (interaction: ButtonInteraction) => {
	const lines = (interaction.message?.rawData.components ?? []).flatMap(collectText)
	const requesterLine = lines.find((line) => line.startsWith("Requester: "))
	const channelLine = lines.find((line) => line.startsWith("Channel name: "))
	const creatorId = requesterLine?.match(/<@(\d+)>/)?.[1]
	const name = channelLine?.match(/\*\*(.+)\*\*/)?.[1]
	const guildId = interaction.rawData.guild_id

	return creatorId && name && guildId ? { creatorId, name, guildId } : null
}

const handledContainer = (title: string, body: string, accentColor: string) =>
	new Container(
		[
			new TextDisplay(`### ${title}`),
			new TextDisplay(body),
			new Separator({ divider: true, spacing: "small" }),
			new Row([new FscRequestYesButton(true), new FscRequestNoButton(true)])
		],
		{ accentColor }
	)

export class FscRequestYesButton extends Button {
	customId = "fsc-request-yes"
	label = "Yes"
	style = ButtonStyle.Success
	ephemeral = true
	defer = true
	disabled = false

	constructor(disabled = false) {
		super()
		this.disabled = disabled
	}

	async run(interaction: ButtonInteraction) {
		const request = parseRequest(interaction)
		if (!request) {
			await interaction.reply({
				components: [
					buildFscContainer("Invalid request", ["Could not read the channel request details from this message."], "#f85149")
				]
			})
			return
		}

		try {
			const channelId = await createFscChannel(
				interaction.client,
				request.guildId,
				request.name,
				request.creatorId
			)
			await interaction.message?.edit({
				components: [
					handledContainer(
						"Fake Slack Connect channel approved",
						`<@${interaction.user?.id}> created <#${channelId}> for <@${request.creatorId}> under <#${fscCategoryId}>.`,
						"#3fb950"
					)
				],
				allowedMentions: { parse: [] }
			})
			await interaction.reply({
				components: [
					buildFscContainer("Channel created", [`Created <#${channelId}>.`], "#3fb950")
				]
			})
		} catch (error) {
			await interaction.reply({
				components: [
					buildFscContainer("Could not create channel", [error instanceof Error ? error.message : "Unknown error."], "#f85149")
				]
			})
		}
	}
}

export class FscRequestNoButton extends Button {
	customId = "fsc-request-no"
	label = "No"
	style = ButtonStyle.Danger
	ephemeral = true
	defer = true
	disabled = false

	constructor(disabled = false) {
		super()
		this.disabled = disabled
	}

	async run(interaction: ButtonInteraction) {
		await interaction.message?.edit({
			components: [
				handledContainer(
					"Fake Slack Connect channel declined",
					`<@${interaction.user?.id}> declined this channel request.`,
					"#f85149"
				)
			],
			allowedMentions: { parse: [] }
		})
		await interaction.reply({
			components: [buildFscContainer("Request declined", ["No channel was created."], "#f85149")]
		})
	}
}

export const fscRequestComponents = [
	new FscRequestYesButton(),
	new FscRequestNoButton()
]
