import { triggers_match } from '$lib/server/triggers'

export function get_cached_notes(llm_input: CopilotLlmInput): CopilotLlmNote[] {
	const verse_cache = notes_cache_map.get(llm_input.verse)
	if (!verse_cache) {
		return []
	}

	const settings_key = JSON.stringify({ lwc: llm_input.output_language, prose_level: llm_input.prose_level })
	const settings_cache = verse_cache.get(settings_key)
	if (!settings_cache) {
		return []
	}

	return llm_input.triggers.map(trigger => settings_cache.find(cached_note => triggers_match(trigger, cached_note.trigger))).filter(note => !!note)
}

const notes_cache_map: Map<string, Map<string, CopilotLlmNote[]>> = new Map([
	['Titus 1:2', new Map([
			[JSON.stringify({ lwc: 'English', prose_level: 'grade5' }), [
				{
					meaning: 'The statement that he never lies describes something that is always true about God, strongly emphasizing that he is completely unable to say things that are not true.',
					check: 'Consider whether your translation of he never lies shows that this is always true of God, and whether it strongly emphasizes that he never speaks falsely.',
					trigger: {
						name: 'TAMP',
						node_id: '3.2.0',
					},
				},
			]],
			[JSON.stringify({ lwc: 'English', prose_level: 'high_school' }), [
				{
					meaning: 'The statement about God not telling lies is a timeless truth about His character, and it is expressed with strong emphasis.',
					check: 'Please consider whether your translation expresses this as a strong, permanent truth about God, rather than just a statement about a single event.',
					trigger: {
						name: 'TAMP',
						node_id: '3.2.0',
					},
				},
			]],
			[JSON.stringify({ lwc: 'English', prose_level: 'undergraduate' }), [
				{
					meaning: 'The verb phrase here denotes a timeless, universal truth regarding God\'s character, combined with a highly emphatic negation of speaking untruths.',
					check: 'Please consider whether your translation conveys this as an enduring, characteristic attribute of God rather than a localized event, and whether the negative aspect of the statement is sufficiently emphasized.',
					trigger: {
						name: 'TAMP',
						node_id: '3.2.0',
					},
				},
			]],
		]),
	],
	['Titus 1:4', new Map([
			[JSON.stringify({ lwc: 'English', prose_level: 'high_school' }), [
				{
					meaning: 'The action of writing this letter is happening at the present time.',
					check: 'Consider whether your translation uses a present tense verb form to show that this action is currently taking place.',
					trigger: {
						name: 'TAMP',
						node_id: '0.2.0',
					},
				},
				{
					meaning: 'The writer compares Titus to a true son to describe their close spiritual relationship, even though they are not biologically related.',
					check: 'Consider whether your translation communicates this close relationship in a way that does not confuse readers into thinking they are biological relatives.',
					trigger: {
						name: 'Metaphor',
						node_id: '1',
					},
				},
				{
					meaning: 'The reason Titus is described as a true son is because of the faith that he and the writer share.',
					check: 'Consider whether your translation expresses that this shared faith is the reason for their close relationship.',
					trigger: {
						name: 'Means/Reason',
						node_id: '1.3.0',
					},
				},
				{
					meaning: 'The pronoun "we" in the phrase referring to the faith that they share refers to both the writer, Paul, and the reader, Titus.',
					check: 'Consider whether your translation uses a pronoun for "we" that includes both the speaker and the person being addressed.',
					trigger: {
						name: 'Noun Person',
						node_id: '1.3.2.0.0',
					},
				},
				{
					meaning: 'The pronoun "we" in the phrase referring to the faith that they share refers to exactly two people, Paul and Titus.',
					check: 'Consider whether your translation uses a pronoun that refers to exactly two people.',
					trigger: {
						name: 'Noun Number',
						node_id: '1.3.2.0.0',
					},
				},
				{
					meaning: 'The reason Titus is described as a true son is because both he and the writer believe in Christ.',
					check: 'Consider whether your translation expresses that their mutual belief is the reason for their close relationship.',
					trigger: {
						name: 'Means/Reason',
						node_id: '2.3.0',
					},
				},
			]],
		]),
	],
	['Titus 1:5', new Map([
			[JSON.stringify({ lwc: 'English', prose_level: 'undergraduate' }), [
				{
					meaning: 'This is the first time Crete is mentioned in this book, and Crete is an island.',
					check: 'Consider making this clear in your translation or include a footnote.',
					trigger: {
						name: 'Explanation of Name',
						node_id: '1.0.3.1',
					},
				},
				{
					meaning: 'This connector introduces a result, showing that Paul\'s instruction to Titus was the direct consequence of Paul not being able to finish the work.',
					check: 'Consider whether your translation uses a connector that shows this cause-and-effect relationship.',
					trigger: {
						name: 'Intent/Result',
						node_id: '1.4.3.0',
					},
				},
				{
					meaning: 'This verb describes an ongoing action, meaning that Titus was to keep doing or carry on the work.',
					check: 'Consider whether your translation expresses that this work was to be done continuously.',
					trigger: {
						name: 'TAMP',
						node_id: '1.4.3.2.0',
					},
				},
				{
					meaning: 'This clause expresses a negative state, meaning that Paul did not have the ability to complete the work himself.',
					check: 'Consider whether your translation clearly expresses that Paul was unable to do this work.',
					trigger: {
						name: 'TAMP',
						node_id: '2.2.0',
					},
				},
				{
					meaning: 'This verb describes a completed action, meaning that the work would be brought to a full end.',
					check: 'Consider whether your translation expresses the idea of bringing the work to completion or finishing it.',
					trigger: {
						name: 'TAMP',
						node_id: '2.3.1.1.0',
					},
				},
				{
					meaning: 'This connector introduces the purpose or goal for why Paul asked Titus to stay on Crete.',
					check: 'Consider whether your translation clearly shows that Titus staying on Crete was for the purpose of doing the work.',
					trigger: {
						name: 'Intent/Result',
						node_id: '3.0',
					},
				},
			]],
		]),
	],
	['Titus 1:9', new Map([
			[JSON.stringify({ lwc: 'English', prose_level: 'high_school' }), [
				{
					meaning: 'The original text did not include the one doing the teaching of the faithful message, but it is likely Paul (and his companions).',
					check: 'Consider including Paul (and his companions) as the ones doing the teaching of the faithful message if your language needs it.',
					trigger: {
						name: 'Optional Agent of Passive',
						node_id: '0.2.2.0',
					},
				},
				{
					meaning: 'The word for "we" or "us" used in the context of teaching the faithful message includes both the writer and the readers or listeners.',
					check: 'Consider whether your translation includes writer and the readers or listeners as part of the group that taught the faithful message.',
					trigger: {
						name: 'Noun Person',
						node_id: '0.2.2.0.0',
					},
				},
				{
					meaning: 'The ability of the elder to encourage others is a direct result of him believing the faithful message.',
					check: 'Consider whether your translation expresses this relationship as a result, showing that the second action happens because of the first.',
					trigger: {
						name: 'Intent/Result',
						node_id: '1.0',
					},
				},
				{
					meaning: 'Teaching the right things is the means or method by which the elder is able to encourage people.',
					check: 'Consider whether your translation shows that teaching the right things is the way the elder is able to encourage people.',
					trigger: {
						name: 'Means/Reason',
						node_id: '1.3.1.3.0',
					},
				},
			]],
		]),
	],
	['Titus 3:15', new Map([
			[JSON.stringify({ lwc: 'English', prose_level: 'high_school' }), [
				{
					meaning: 'The word "us" in the phrase "who love us" refers to Paul and his companions, but it does not include Titus, who is receiving the letter.',
					check: 'Consider whether your translation of "us" indicates that the reader is excluded from this group.',
					trigger: {
						name: 'Noun Person',
						node_id: '1.3.1.2.0',
					},
				},
			]],
			[JSON.stringify({ lwc: 'Indonesian', prose_level: 'high_school' }), [
				{
					meaning: `Kata ganti orang pertama jamak dalam frasa 'orang-orang percaya yang mengasihi kami' merujuk kepada penulis dan rekan-rekannya, tetapi tidak menyertakan pembaca.`,
					check: 'Pertimbangkan apakah terjemahan Anda mengekspresikan bahwa pembaca tidak termasuk dalam kelompok orang yang dikasihi tersebut.',
					trigger: {
						name: 'Noun Person',
						node_id: '1.3.1.2.0',
					},
				},
			]],
		]),
	],
	['Jonah 3:4', new Map([
			[JSON.stringify({ lwc: 'English', prose_level: 'high_school' }), [
				{
					meaning: 'This statement is spoken by a man addressing a large crowd of people.',
					check: 'Consider whether your translation uses the appropriate words or grammatical forms for a person speaking publicly to a large group.',
					trigger: {
						name: 'Social Dynamic',
						node_id: '2.2',
					},
				},
				{
					meaning: 'The original text did not include the one doing the destroying, but it is likely Yahweh.',
					check: 'Consider including Yahweh as the one doing the destroying if your language needs it.',
					trigger: {
						name: 'Optional Agent of Passive',
						node_id: '2.2.1',
					},
				},
			]],
		]),
	],
])