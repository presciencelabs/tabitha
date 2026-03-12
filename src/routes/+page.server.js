/** @type {import('./$types').PageServerLoad} */
export async function load() {

	/** @type {CopilotSettings} */
	const settings = {
		language_profile: {
			rhetorical_questions: true,
			clusivity: true,
			passive: true,
			dual: true,
			trial: true,
			honorifics: true,
			indirect_speech: true,
		},
		lwc: 'English',
		mtt_level: 'high_school',
		max_cautions: -1,
	}

	/** @type {Reference} */
	const reference = {
		book: 'Genesis',
		chapter: 1,
		verse: 1,
	}

	return {
		settings,
		reference,
	}
}