import { describe, expect, it } from "bun:test"
import {
	ApplicationIntegrationType,
	type CommandInteraction,
	InteractionContextType,
	serializePayload
} from "@buape/carbon"
import AdminCommand from "../src/commands/admin.js"
import RoleCommand from "../src/commands/role.js"
import SlapCommand from "../src/commands/slap.js"
import { nominationConfig } from "../src/config/nominations.js"

const flattenComponents = (component: unknown): Record<string, unknown>[] => {
	if (!component || typeof component !== "object") {
		return []
	}

	const record = component as Record<string, unknown>
	const children = Array.isArray(record.components)
		? record.components.flatMap(flattenComponents)
		: []

	return [record, ...children]
}

const payloadText = (payload: unknown) =>
	flattenComponents(serializePayload(payload))
		.map((component) => component.content)
		.filter((content): content is string => typeof content === "string")
		.join("\n")

const makeInteraction = (roleIds: string[]) => {
	const replies: unknown[] = []
	const interaction = {
		member: {
			roles: roleIds.map((id) => ({ id }))
		},
		user: { id: "actor-1" },
		userId: "actor-1",
		options: {
			getUser: () => ({ id: "target-1" })
		},
		reply: async (payload: unknown) => {
			replies.push(payload)
		}
	} as unknown as CommandInteraction

	return { interaction, replies }
}

describe("command registration changes", () => {
	it("removes showcase-ban from /role", () => {
		expect(new RoleCommand().subcommands.map((command) => command.name)).toEqual([
			"clawtributor",
			"maintainer-guest"
		])
	})

	it("removes trial-mod from /admin", () => {
		expect(
			new AdminCommand().subcommandGroups.map((command) => command.name)
		).toEqual(["fsc"])
	})
})

describe("/slap", () => {
	it("is guild-only and limited to the configured guild", () => {
		const command = new SlapCommand()

		expect(command.contexts).toEqual([InteractionContextType.Guild])
		expect(command.integrationTypes).toEqual([
			ApplicationIntegrationType.GuildInstall
		])
		expect(command.guildIds).toEqual([nominationConfig.guildId])
	})

	it("rejects users outside the Community Team", async () => {
		const { interaction, replies } = makeInteraction([])

		await new SlapCommand().run(interaction)

		expect(payloadText(replies[0])).toContain("Community Team only.")
		expect(replies[0]).toEqual(expect.objectContaining({ ephemeral: true }))
	})

	it("lets Community Team members slap a user", async () => {
		const { interaction, replies } = makeInteraction([
			nominationConfig.approverRoleIds[0]
		])

		await new SlapCommand().run(interaction)

		expect(payloadText(replies[0])).toContain(
			"<@actor-1> slapped <@target-1>."
		)
	})
})
