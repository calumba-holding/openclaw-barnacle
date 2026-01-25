import { ApplicationCommandOptionType, type CommandInteraction } from "@buape/carbon"
import BaseCommand from "./base.js"

const stuckLink = "https://docs.clawd.bot/help/faq#im-stuck-whats-the-fastest-way-to-get-unstuck"

export default class HelpCommand extends BaseCommand {
	name = "help"
	description = "Share help instructions"
	options = [
		{
			name: "user",
			description: "User to mention",
			type: ApplicationCommandOptionType.User
		}
	]

	async run(interaction: CommandInteraction) {
		const user = interaction.options.getUser("user")
		const prefix = user ? `<@${user.id}>\n` : ""
		const message = `${prefix}Use <#1459642797895319552> for help. The fastest way to get your problem solved is to follow the instructions here: ${stuckLink}`

		await interaction.reply({
			content: message
		})
	}
}
