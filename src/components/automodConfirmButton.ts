import {
	Button,
	type ButtonInteraction,
	ButtonStyle,
	type ComponentData,
	TextDisplay
} from "@buape/carbon"

export default class AutomodConfirmButton extends Button {
	customId = "automod-confirm"
	label = "Ping the mods"
	style = ButtonStyle.Secondary

	constructor(roleId: string) {
		super()
		this.customId = `automod-confirm:roleId=${roleId}`
	}

	async run(interaction: ButtonInteraction, data: ComponentData) {
		const roleId = String(data.roleId)
		await interaction.reply({
			components: [
				new TextDisplay(`Tide’s up, calling in <@&${roleId}>.`)
			],
			allowedMentions: {
				roles: [roleId]
			}
		})
	}
}
