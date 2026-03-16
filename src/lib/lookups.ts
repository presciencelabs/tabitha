import { PUBLIC_TARGETS_API_HOST, PUBLIC_SOURCES_API_HOST } from '$env/static/public'

export async function fetch_encoding(verse_ref: Reference): Promise<SourceApiResult|undefined> {
	const { book, chapter, verse } = verse_ref
	const response = await fetch(`${PUBLIC_SOURCES_API_HOST}/Bible/${book}/${chapter}/${verse}/simple-json?glosses=true`)
	if (!response.ok) {
		console.error(await response.text())
		return undefined
	}
	return await response.json() as SourceApiResult
}

export async function fetch_target_text(verse_ref: Reference, project: string, preferred_audience: string): Promise<TargetApiResult|undefined> {
	const { book, chapter, verse } = verse_ref
	const response = await fetch(`${PUBLIC_TARGETS_API_HOST}/${project}/${book}/${chapter}/${verse}`)
	if (!response.ok) {
		console.error(await response.text())
		return undefined
	}
	const results = await response.json() as TargetApiResult[]
	return results.find(res => res.audience === preferred_audience) || results.at(0)
}

export const polished_books = [
	'Genesis',
	'Joshua',
	'Ruth',
	'1 Samuel',
	'2 Samuel',
	'Nehemiah',
	'Esther',
	'Daniel',
	'Jonah',
	'Nahum',
	'Matthew',
	'Mark',
	'Acts',
	'Titus',
	'Philemon',
	'3 John',
]

export const language_profile_infos: Record<keyof LanguageProfile, [string, string]> = {
	'rhetorical_questions': [
		'Rhetorical Questions',
		'Your language uses and understands rhetorical questions. If not, the copilot will show notes that suggest an equivalent statement for any rhetorical questions.',
	],
	'passive': [
		'Passive',
		'Your language has a passive voice. If not, the copilot will show notes that identify any actor that is not explicitly mentioned.',
	],
	'honorifics': [
		'Honorifics',
		'Your language has special markings or pronouns for acknowledging social relationships or dynamics. The copilot will show notes to help identify these relationships.',
	],
	'indirect_speech': [
		'Indirect Speech',
		'Your language uses indirect speech ("John said that Mary left"). If not, the copilot will show notes to help convert these to direct quotes.',
	],
	'clusivity': [
		'Inclusive and exclusive "we"',
		'Your language marks inclusive "we" (we with you) differently from exclusive "we" (we without you). The copilot will show notes for when "we" is exclusive.',
	],
	'dual': [
		'Dual number',
		'Your language has a special marking for when there are exactly two of a thing (eg "John\'s EYES"). The copilot will show notes to identify possible nouns that need this marking.',
	],
	'trial': [
		'Trial number',
		'Your language has a special marking for when there are exactly three of a thing (eg "We (three)"). The copilot will show notes to identify possible nouns that need this marking.',
	],
	'closing_quotation_frame': [
		'Closing quotation frames',
		'Your language closes a quotation by putting some special words in the end. The copilot will show notes to remind how longer quotes were introduced.',
	],
}