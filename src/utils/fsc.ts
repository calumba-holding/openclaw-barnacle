import {
	ChannelType,
	Container,
	PermissionFlagsBits,
	Routes,
	Separator,
	TextDisplay,
	type APIChannel,
	type Client
} from "@buape/carbon"

export const fscCategoryId = "1481071328990859454"
export const fscRequestChannelId = "1464886408090226902"
export const shadowUserId = "439223656200273932"

const isMemberOverwrite = (type: unknown) => type === 1 || type === "member"

export const sanitizeFscChannelName = (name: string) =>
	name
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9-]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.replace(/-{2,}/g, "-")
		.slice(0, 90)

export const buildFscContainer = (
	title: string,
	body: string[],
	accentColor = "#5865f2"
) =>
	new Container(
		[
			new TextDisplay(`### ${title}`),
			...body.map((line) => new TextDisplay(line))
		],
		{ accentColor }
	)

export const buildFscRequestContainer = (creatorId: string, name: string) =>
	new Container(
		[
			new TextDisplay("### Fake Slack Connect channel request"),
			new TextDisplay(`Requester: <@${creatorId}>`),
			new TextDisplay(`Channel name: **${name}**`),
			new Separator({ divider: true, spacing: "small" }),
			new TextDisplay(`Create this channel under <#${fscCategoryId}>?`)
		],
		{ accentColor: "#f1c40f" }
	)

export const isFscChannel = async (client: Client, channelId: string) => {
	const channel = (await client.rest.get(Routes.channel(channelId))) as APIChannel
	return "parent_id" in channel && channel.parent_id === fscCategoryId
}

export const addFscUserToChannel = async (
	client: Client,
	channelId: string,
	userId: string
) => {
	const channel = (await client.rest.get(Routes.channel(channelId))) as APIChannel
	if (!("parent_id" in channel) || channel.parent_id !== fscCategoryId) {
		throw new Error("Channel is not in the Fake Slack Connect category.")
	}

	const overwrites =
		"permission_overwrites" in channel ? channel.permission_overwrites ?? [] : []
	const existing = overwrites.find(
		(overwrite) => isMemberOverwrite(overwrite.type) && overwrite.id === userId
	)
	const allow = (existing ? BigInt(existing.allow) : 0n) | PermissionFlagsBits.ViewChannel
	const deny = existing
		? BigInt(existing.deny) & ~PermissionFlagsBits.ViewChannel
		: 0n

	await client.rest.put(Routes.channelPermission(channelId, userId), {
		body: {
			type: 1,
			allow: allow.toString(),
			deny: deny.toString()
		}
	})
}

export const createFscChannel = async (
	client: Client,
	guildId: string,
	name: string,
	creatorId: string
) => {
	const channelName = sanitizeFscChannelName(name)
	if (!channelName) {
		throw new Error("Channel name must include at least one letter or number.")
	}

	const channel = (await client.rest.post(Routes.guildChannels(guildId), {
		body: {
			name: channelName,
			type: ChannelType.GuildText,
			parent_id: fscCategoryId
		}
	})) as APIChannel

	if (!("id" in channel) || typeof channel.id !== "string") {
		throw new Error("Discord did not return the created channel.")
	}

	const textChannel = await client.fetchChannel(channel.id)
	if (textChannel && "send" in textChannel) {
		await textChannel.send({
			content: `<@${creatorId}>`,
			components: [
				buildFscContainer("Fake Slack Connect channel created", [
					`<@${creatorId}>, your channel is ready.`
				], "#3fb950")
			],
			allowedMentions: { users: [creatorId] }
		})
	}

	return channel.id
}
