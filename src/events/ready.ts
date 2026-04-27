import { ReadyListener, type ListenerEventData } from "@buape/carbon"

export default class Ready extends ReadyListener {
	async handle(data: ListenerEventData[this["type"]]) {
		console.log(`Logged in as ${data.user.username}`)
	}
}
