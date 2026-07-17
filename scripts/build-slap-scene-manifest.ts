import { mkdir } from "node:fs/promises"
import { dirname } from "node:path"
import {
	slapConfig,
	slapSceneVariants,
	type SlapOutcome
} from "../src/config/slap.js"

type FishVisual = {
	species: string
	appearance: string
	contactSurface: string
	safetyNote?: string
}

type Treatment = {
	scene: string
	composition: string
	lighting: string
}

const outputPath =
	Bun.argv[2] ?? "tmp/imagegen/slap-scenes.jsonl"

const fishVisuals: Record<string, FishVisual> = {
	"procedural-herring": {
		species: "Atlantic herring",
		appearance: "slender silver body with a blue-green back",
		contactSurface: "broad silver flank"
	},
	"compliance-sardine": {
		species: "European sardine",
		appearance: "small silver body with subtle dark spots",
		contactSurface: "flat silver side"
	},
	"moderate-concern-mackerel": {
		species: "Atlantic mackerel",
		appearance: "streamlined silver body with dark wavy back stripes",
		contactSurface: "striped flank"
	},
	"rubber-stamp-trout": {
		species: "rainbow trout",
		appearance: "speckled silver body with a muted pink lateral stripe",
		contactSurface: "speckled broad side"
	},
	"escalation-salmon": {
		species: "Atlantic salmon",
		appearance: "large muscular silver body with dark dorsal spots",
		contactSurface: "heavy silver flank"
	},
	"inflatable-pufferfish": {
		species: "inflated yellow-spotted pufferfish",
		appearance: "round inflated body with soft visible spines",
		contactSurface: "rounded side",
		safetyNote: "the pufferfish spines are soft theatrical props and cause no injury"
	},
	"filing-cabinet-flounder": {
		species: "European flounder",
		appearance: "flat mottled brown body with both eyes on the upper side",
		contactSurface: "wide flat side"
	},
	"due-process-swordfish": {
		species: "swordfish",
		appearance: "powerful silver-blue body with a long recognizable bill",
		contactSurface: "broad body flank",
		safetyNote: "the swordfish bill always points safely away from every person"
	},
	"corrective-action-eel": {
		species: "European eel",
		appearance: "long flexible dark olive body with a pale underside",
		contactSurface: "flexible middle section"
	},
	"sturgeon-general": {
		species: "Atlantic sturgeon",
		appearance: "large gray body with distinct rows of bony scutes",
		contactSurface: "heavy armored flank"
	},
	"final-notice-tuna": {
		species: "bluefin tuna",
		appearance: "large deep-bodied silver fish with a dark blue back and light frost",
		contactSurface: "broad frosty flank"
	},
	"ancient-coelacanth": {
		species: "blue coelacanth",
		appearance: "prehistoric deep-blue body with pale mottling and lobed fins",
		contactSurface: "massive ancient flank"
	}
}

const standardOutcomes = [
	"normal",
	"critical",
	"dodge",
	"refusal",
	"double",
	"self",
	"hermit",
	"rock_lobster",
	"bot"
] satisfies SlapOutcome[]

const treatments: readonly Treatment[] = [
	{
		scene:
			"a fluorescent municipal records office with filing cabinets, loose forms, and a metal bucket",
		composition:
			"landscape side-angle medium-wide shot with the entire action silhouette and contact point unobstructed near center",
		lighting:
			"crisp institutional lighting with high-speed water droplets and absurdly serious administrative energy"
	},
	{
		scene:
			"a formal civic hearing chamber with long tables, rolling chairs, folders, and polished wood",
		composition:
			"landscape low-angle wide shot with full fish bodies readable and every participant clearly separated",
		lighting:
			"dramatic cinematic backlight with sharp impact detail and deadpan courtroom gravity"
	},
	{
		scene:
			"a busy community operations room with practical desks, blank monitors, clipboards, and a water cooler",
		composition:
			"landscape front three-quarter action shot with expressive reactions, clear spatial storytelling, and no cropped fish",
		lighting:
			"bright polished movie lighting with suspended spray and energetic workplace-comedy timing"
	}
]

const legendaryTreatments: readonly Treatment[] = [
	{
		scene:
			"a monumental maritime tribunal with stone columns, storm light, suspended archival pages, and a circular wall of seawater",
		composition:
			"landscape heroic wide shot with the coelacanth silhouette and exact cheek contact fully visible",
		lighting:
			"lightning mixed with golden tribunal light, awe-inspiring and ridiculous"
	},
	{
		scene:
			"an ancient flooded archive with towering shelves, fossil displays, and a tidal shockwave frozen in midair",
		composition:
			"landscape low-angle epic shot with both adults, the complete coelacanth, and the impact point clearly readable",
		lighting:
			"deep ocean-blue shafts of light with warm archival lamps and cinematic spray"
	},
	{
		scene:
			"a vast moonlit aquarium court where ancient stone and modern office furniture meet under swirling water",
		composition:
			"landscape sweeping three-quarter shot centered on unmistakable coelacanth-to-cheek contact",
		lighting:
			"silver moonlight, bright impact rim light, and mythic high-speed droplets"
	}
]

const fishDescription = (visual: FishVisual) =>
	`one whole anatomically recognizable ${visual.species}, ${visual.appearance}`

const actionFor = (
	outcome: SlapOutcome,
	visual: FishVisual,
	variantIndex: number
) => {
	const fish = `whole ${visual.species}`
	const contact = visual.contactSurface

	switch (outcome) {
		case "normal":
			return [
				`A generic adult swings a ${fish} sideways so its ${contact} is visibly pressed against another generic adult's cheek at the exact instant of a routine fish slap.`,
				`A perfectly timed harmless fish slap: one generic adult follows through with a ${fish}, its ${contact} visibly bending against another generic adult's cheek while a few papers lift from a desk.`,
				`A crisp high-speed comedy freeze-frame of a generic adult delivering one standard ${fish} slap, with clear broadside cheek contact and the surprised target beginning to recoil.`
			][variantIndex]
		case "critical":
			return [
				`An outrageously dramatic but harmless critical fish slap with a ${fish}; its ${contact} visibly compresses a generic adult's cheek while papers, spray, and a rolling chair blast outward.`,
				`A generic adult lands an epic full-force theatrical slap with a ${fish}, the ${contact} unmistakably contacting the target's cheek as folders and water droplets erupt around them without injury.`,
				`A premium action-movie freeze-frame of catastrophic fish-to-cheek alignment: the ${fish}'s ${contact} lands squarely, the target recoils, and office objects lift in an exaggerated harmless shockwave.`
			][variantIndex]
		case "dodge":
			return [
				`The intended generic adult target ducks under a thrown ${fish}; the fish curves back like a boomerang and its ${contact} visibly slaps the surprised generic adult thrower on the cheek while the target remains untouched.`,
				`The intended target sidesteps a ${fish} in one clear motion, and the missed fish loops back to make obvious broadside cheek contact with the thrower; both adults and the full return path are readable.`,
				`The target leans safely out of the way as a ${fish} completes an absurd return-to-sender arc and lands its ${contact} against the thrower's cheek, leaving the target clearly unslapped.`
			][variantIndex]
		case "refusal":
			return [
				`A generic adult attempts a fish slap, but the lively ${fish} wriggles free before reaching the target and dives headfirst into a protective metal bucket; the thrower's empty hand follows through and the target remains clearly untouched.`,
				`The ${fish} dramatically twists out of a generic adult's grip and springs backward onto a wheeled office tray rather than contact the waiting target; the failed throw and untouched cheek are unmistakable.`,
				`At the instant a slap should happen, the ${fish} forcefully escapes sideways from the thrower's hands and lands safely between two empty chairs, while the intended target watches from a clearly separate, unslapped position.`
			][variantIndex]
		case "double":
			return [
				`One generic adult uses two matching whole ${visual.species}, one in each hand, to make simultaneous broadside contact with both cheeks of another generic adult in an unmistakable double fish slap.`,
				`A symmetrical comedy impact with exactly two matching whole ${visual.species}: the same generic adult's two arms bring one fish onto each side of the target's face at the same instant.`,
				`A spectacular duplicate-service freeze-frame where one generic adult lands two matching ${visual.species} broadside against the target's left and right cheeks, with both complete fish and both contact points visible.`
			][variantIndex]
		case "legendary":
			return [
				`A generic adult wields an enormous ancient ${visual.species}; its ${contact} visibly strikes another generic adult's cheek in a legendary fish slap that releases a circular wall of seawater without injury.`,
				`The ancient fisheries seal has broken: a complete giant ${visual.species} crosses the chamber and makes unmistakable broadside cheek contact with a generic adult as a mythic tidal shockwave erupts.`,
				`A once-in-history maritime judgment captured at impact, with a huge ${visual.species} visibly contacting a generic adult's cheek while the room reacts as though time and tide briefly stopped.`
			][variantIndex]
		case "self":
			return [
				`A harmless physical-comedy rehearsal mishap: one generic adult holds the tail of a slippery ${fish}, and the loose fish unexpectedly pivots back so its ${contact} lands flat against that same performer's cheek; the hand, fish arc, and accidental contact are all visible.`,
				`During a staged fish-handling demonstration, one generic adult loses control of a ${fish}; it harmlessly swings around from momentum and its ${contact} bumps the same surprised performer's cheek in an obvious accident.`,
				`A generic adult fumbles a wet ${fish} during a comedy rehearsal, and the fish slips upward to land broadside across that same performer's cheek; the accidental prop mishap is clear and non-distressing.`
			][variantIndex]
		case "hermit":
			return [
				`A generic adult swings a ${fish} toward a compact original neon-accented hermit robot, but the robot catches the fish one-handed inches before impact and firmly pushes it back toward the stunned thrower.`,
				`An original hard-shell moderation robot calmly intercepts a flying ${fish} with a mechanical clamp before it can make contact, confiscating the complete fish while the generic adult thrower recoils.`,
				`A generic adult attempts a ${fish} slap, but a compact friendly hermit robot blocks it with a metal tray and returns the intact fish toward the thrower; the rejection is immediate and unmistakable.`
			][variantIndex]
		case "rock_lobster":
			return [
				`A generic adult attempts to swing a ${fish} at an enormous red rock lobster, but the lobster effortlessly catches the complete fish in one claw and points the other claw back at the embarrassed thrower.`,
				`A giant anatomically plausible red rock lobster blocks an incoming ${fish} with its armored claw, lifts the intact fish safely overhead, and stares down the generic adult thrower with absolute authority.`,
				`The ${fish} never reaches the giant red rock lobster: one claw intercepts it mid-swing while the other gently redirects the failed request toward the surprised generic adult.`
			][variantIndex]
		case "bot":
			return [
				`A generic adult slaps a friendly original humanoid service robot across its metal cheek panel with a ${fish}; the ${contact} is visibly pressed against the robot's face at the exact harmless instant of impact.`,
				`A clear high-speed comedy image of a ${fish} making broadside contact with an original service robot's face display while the generic adult thrower follows through and tiny status lights flicker.`,
				`A generic adult lands one theatrical ${fish} slap on a friendly unbranded humanoid robot, with the complete fish, the robot's undamaged cheek panel, and the contact point fully visible.`
			][variantIndex]
	}
}

const subjectFor = (outcome: SlapOutcome, visual: FishVisual) => {
	const description = fishDescription(visual)
	switch (outcome) {
		case "self":
			return `one fictional adult performer and ${description}`
		case "hermit":
			return `one fictional adult, one original compact hard-shell robot, and ${description}`
		case "rock_lobster":
			return `one fictional adult, one large anatomically plausible red rock lobster, and ${description}`
		case "bot":
			return `one fictional adult, one original friendly humanoid service robot, and ${description}`
		case "double":
			return `two fictional adults and exactly two matching whole anatomically recognizable ${visual.species}`
		default:
			return `two fictional adults and ${description}`
	}
}

const outcomeComposition = (outcome: SlapOutcome) => {
	switch (outcome) {
		case "dodge":
			return "Show the untouched dodging target and the struck thrower in the same frame."
		case "refusal":
			return "Show the escaping fish, failed follow-through, and untouched target in one readable frame."
		case "double":
			return "Both fish-to-cheek contact points must be unobstructed and immediately readable."
		case "self":
			return "Show one performer only, with the held fish and accidental return path clearly connected."
		case "hermit":
			return "Center the robot's interception and keep the fish visibly separated from the robot's face."
		case "rock_lobster":
			return "Make the lobster dominant while keeping the caught fish and failed swing fully visible."
		case "bot":
			return "Keep the fish-to-robot face contact central and the robot visibly undamaged."
		default:
			return "The fish-to-cheek contact is the unmistakable focal point."
	}
}

const constraintsFor = (outcome: SlapOutcome, visual: FishVisual) => {
	const fishCount = outcome === "double"
		? "exactly two matching fish"
		: "exactly one fish"
	const safety = visual.safetyNote ? `; ${visual.safetyNote}` : ""
	return `harmless theatrical slapstick; generic fictional adults only; no real identities; no minors; no blood; no wounds; no gore; no injury; no distress; no readable text; no signs; no logos; no watermark; ${fishCount}; fish anatomy remains recognizable; normal human anatomy; no duplicate limbs${safety}`
}

const jobs = slapConfig.fish.flatMap((fish) => {
	const visual = fishVisuals[fish.slug]
	if (!visual) {
		throw new Error(`Missing visual specification for ${fish.slug}`)
	}
	const outcomes = fish.rarity === "legendary"
		? [...standardOutcomes, "legendary" as const]
		: standardOutcomes

	return outcomes.flatMap((outcome) =>
		slapSceneVariants.map((variant, variantIndex) => {
			const treatment = outcome === "legendary"
				? legendaryTreatments[variantIndex]
				: treatments[variantIndex]
			const action = actionFor(outcome, visual, variantIndex)
			if (!treatment || !action) {
				throw new Error(`Missing prompt treatment for ${outcome} variant ${variant}`)
			}

			const prompt = [
				`Use case: ${outcome === "legendary" || outcome === "hermit" || outcome === "rock_lobster" || outcome === "bot" ? "stylized-concept" : "photorealistic-natural"}`,
				"Asset type: Discord slap-command action scene",
				`Primary request: ${action}`,
				`Scene/backdrop: ${treatment.scene}`,
				`Subject: ${subjectFor(outcome, visual)}`,
				"Style/medium: premium polished photorealistic action-comedy movie still with realistic skin, scales, wet texture, and believable motion",
				`Composition/framing: ${treatment.composition}. ${outcomeComposition(outcome)}`,
				`Lighting/mood: ${treatment.lighting}`,
				`Constraints: ${constraintsFor(outcome, visual)}`
			].join("\n")

			return {
				out: `${fish.slug}--${outcome}-${variant.toString().padStart(2, "0")}.webp`,
				prompt,
				size: "1536x1024",
				quality: "medium",
				output_format: "webp",
				output_compression: 80
			}
		})
	)
})

await mkdir(dirname(outputPath), { recursive: true })
await Bun.write(
	outputPath,
	`${jobs.map((job) => JSON.stringify(job)).join("\n")}\n`
)

console.log(`Wrote ${jobs.length} slap scene jobs to ${outputPath}`)
