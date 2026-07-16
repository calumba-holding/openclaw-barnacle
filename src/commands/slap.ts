import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	Container,
	type CommandInteraction,
	InteractionContextType,
	TextDisplay
} from "@buape/carbon"
import { nominationConfig } from "../config/nominations.js"
import BaseCommand from "./base.js"

const isCommunityTeamMember = (interaction: CommandInteraction) =>
	interaction.member?.roles.some((role) =>
		nominationConfig.approverRoleIds.includes(role.id)
	) ?? false

export default class SlapCommand extends BaseCommand {
	name = "slap"
	description = "Slap a user"
	integrationTypes = [ApplicationIntegrationType.GuildInstall]
	contexts = [InteractionContextType.Guild]
	guildIds = [nominationConfig.guildId]
	options = [
		{
			type: ApplicationCommandOptionType.User as const,
			name: "user",
			description: "The user to slap",
			required: true
		}
	]

	async run(interaction: CommandInteraction) {
		if (!isCommunityTeamMember(interaction)) {
			await interaction.reply({
				components: [
					new Container(
						[new TextDisplay("Community Team only.")],
						{ accentColor: "#f85149" }
					)
				],
				ephemeral: true,
				allowedMentions: { parse: [] }
			})
			return
		}

		const actorId = interaction.user?.id ?? interaction.userId
		if (!actorId) {
			await interaction.reply({
				components: [
					new Container(
						[new TextDisplay("Could not identify the person using this command.")],
						{ accentColor: "#f85149" }
					)
				],
				ephemeral: true,
				allowedMentions: { parse: [] }
			})
			return
		}

		const target = interaction.options.getUser("user", true)
		const message = actorId === target.id
			? `<@${actorId}> slapped themselves.`
			: `<@${actorId}> slapped <@${target.id}>.`

		await interaction.reply({
			components: [new Container([new TextDisplay(message)])],
			allowedMentions: { users: [actorId, target.id] }
		})
	}
}
