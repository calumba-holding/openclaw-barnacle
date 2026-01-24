import { Command } from "@buape/carbon"

export default abstract class BaseCommand extends Command {
	defer = true
}
