import { PUBLIC_TARGETS_API_HOST, PUBLIC_SOURCES_API_HOST } from '$env/static/public'

export async function fetch_encoding(verse_ref: Reference): Promise<SourceApiResult|undefined> {
	const { book, chapter, verse } = verse_ref
	const response = await fetch(`${PUBLIC_SOURCES_API_HOST}/Bible/${book}/${chapter}/${verse}/simple-json?glosses=true`)
	if (!response.ok) {
		return undefined
	}
	return await response.json() as SourceApiResult
}

export async function fetch_target_text(verse_ref: Reference, project: string, preferred_audience: string): Promise<TargetApiResult|undefined> {
	const { book, chapter, verse } = verse_ref
	const response = await fetch(`${PUBLIC_TARGETS_API_HOST}/${project}/${book}/${chapter}/${verse}`)
	if (!response.ok) {
		return undefined
	}
	const results = await response.json() as TargetApiResult[]
	return results.find(res => res.audience === preferred_audience) || results.at(0)
}

export const language_profile_infos: Record<keyof LanguageProfile, string> = {
	'rhetorical_questions': 'Your language uses and understands rhetorical questions. If not, show notes that suggest an equivalent statement for any rhetorical questions.',
	'passive': 'Your language has a passive voice. If not, show notes that identify any actor that is not explicitly mentioned.',
	'honorifics': 'Your language has special markings or pronouns for acknowledging social relationships or dynamics. Show notes to help identify these relationships.',
	'indirect_speech': 'Your langauge uses indirect speech ("John said that Mary left"). If not, show notes to help convert these to direct quotes.',
	'clusivity': 'Your language marks inclusive "we" (me and you) differently from exclusive "we" (me and them). Show notes for when "we" is exclusive.',
	'dual': 'Your language has a special marking for when there are two of a thing (eg "John\'s EYES"). Show notes to identify possible nouns that need this marking.',
	'trial': 'Your language has a special marking for when there are three of a thing (eg "We (three)"). Show notes to identify possible nouns that need this marking.',
	'closing_quotation_frame': 'Your language closes a quotation by repeating part or all of how the quotation was introduced. Show notes to remind how longer quotes were introduced.',
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