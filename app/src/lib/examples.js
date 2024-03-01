
// TODO: maybe this belongs in the data layer...need to consider
/**
 * Transforms a list of examples with "flat" References into a nested structure
 *
 *	{
 *		{
 *			source: string
 *			book: string
 *			chapter: number
 *			verse: number
 *		},
 *		context_arguments: Map<string, string>,
 *	}
 *	=>
 *	{
 *		source: {
 *			book: {
 *				'chapter:verse': [context_arguments],
 *			},
 *		},
 *	}
 *
 * @param {Record<string, Record<string, Record<string, Array<Map<string, string>>>>>} transformed_examples
 * @param {Concept['examples'][0]} example
 */
export function transform_example(transformed_examples, example) {
	const { source, book, chapter, verse } = example.reference
	const chapter_verse = `${chapter}:${verse}`

	// There may be more than one occurrence within the verse, and we want to show all of them
	transformed_examples[source] ??= {}
	transformed_examples[source][book] ??= {}
	transformed_examples[source][book][chapter_verse] ??= []
	transformed_examples[source][book][chapter_verse].push(example.context_arguments)

	return transformed_examples
}

/**
 * @type {Record<string, (stem: string, context_arguments: Map<string, string>) => string>}
 */
const context_argument_displayer = {
	Noun: display_noun_arguments,
	Verb: display_verb_arguments,
	Adjective: display_adjective_arguments,
	Adverb: display_adverb_arguments,
	Adposition: display_adposition_arguments,
}

/**
 *
 * @param {Concept} concept
 * @param {Map<string, string>} context_arguments
 *
 * @returns {string} a readable string to display, representing the context arguments
 */
export function display_context_arguments(concept, context_arguments) {
	const displayer = context_argument_displayer[concept.part_of_speech]
	const readable_example = displayer ? displayer(concept.stem, context_arguments) : ''
	return readable_example
}

/**
 * for Agent -> 'Noun Verb'
 * for other roles -> 'Verb Noun(R)' where R is the role character
 *
 * @param {string} stem
 * @param {Map<string, string>} context_arguments
 *
 * @returns {string}
 */
function display_noun_arguments(stem, context_arguments) {
	let role = context_arguments.get('Role')
	let verb = context_arguments.get('Verb')
	if (role === 'A') {
		return `${stem} ${verb}`
	} else if (role === 'P') {
		return `${verb} ${stem}`
	} else if (role === 'X') {
		return stem
	} else {
		return `${verb} ${stem}(${role})`
	}
}

/**
 * Put the Agent arguments before the verb and all other arguments afterwards.
 * Proposition Arguments are already surrounded by brackets so leave as they are.
 * For the Topic NP, p means 'Most Agent-Like' (active), P means 'Most Patient-Like' (passive)
 * If passive, include (passive)
 *
 * @param {string} stem
 * @param {Map<string, string>} context_arguments
 *
 * @returns {string}
 */
function display_verb_arguments(stem, context_arguments) {
	const parts = [
		context_arguments.get('Topic NP') === 'P' ? '(passive)' : '',
		context_arguments.get('Agent') || '',
		context_arguments.get('Agent Proposition') || '',
		stem,
		context_arguments.get('Patient') || '',
		context_arguments.has('State') ? context_arguments.get('State') + '(S)' : '',
		context_arguments.has('Source') ? context_arguments.get('Source') + '(s)' : '',
		context_arguments.has('Destination') ? context_arguments.get('Destination') + '(d)' : '',
		context_arguments.has('Instrument') ? context_arguments.get('Instrument') + '(I)' : '',
		context_arguments.has('Beneficiary') ? context_arguments.get('Beneficiary') + '(B)' : '',
		context_arguments.get('Patient Proposition') || '',
	]
	return parts.filter(x => x !== '').join(' ')
}

/**
 * Agent Verb (stem ModifiedNoun)
 * Agent Verb (stem (PatientNoun))
 * Agent Verb (stem PatientClause)
 * All arguments except the stem are optional
 * It it currently understood (but not confirmed) that a Modified Noun never occurs with a Patient Noun/Clause
 *
 * @param {string} stem
 * @param {Map<string, string>} context_arguments
 *
 * @returns {string}
 */
function display_adjective_arguments(stem, context_arguments) {
	let degree = context_arguments.get('Degree')
	if (degree && degree !== 'N') {
		// N means 'no degree' so don't bother showing it
		stem = `${stem}(${degree})`
	}

	let patient_noun = context_arguments.get('Patient Noun') || ''
	if (patient_noun !== '') {
		// the patient noun goes in brackets to indicate the nesting
		patient_noun = `(${patient_noun})`
	}

	const parts = [
		context_arguments.get('Agent') || '',
		context_arguments.get('Verb') || '',
		'(',
		stem,
		patient_noun,
		context_arguments.get('Patient Proposition') || '',
		context_arguments.get('Modified Noun') || '',
		')',
	]
	return parts.filter(x => x !== '').join(' ')
}

/**
 * Verb Noun Adjective stem
 * All arguments except the stem are optional
 *
 * @param {string} stem
 * @param {Map<string, string>} context_arguments
 *
 * @returns {string}
 */
function display_adverb_arguments(stem, context_arguments) {
	const parts = [
		context_arguments.get('Verb') || '',
		context_arguments.get('Noun') || '',
		context_arguments.get('Adjective') || '',
		stem,
	]
	return parts.filter(x => x !== '').join(' ')
}

/**
 * In adjunct phrase -> Verb (stem Noun)
 * In Noun-Noun relationship -> (HeadNoun (stem Noun))
 * In adverbial clause -> [stem... ]

 * @param {string} stem
 * @param {Map<string, string>} context_arguments
 *
 * @returns {string}
 */
function display_adposition_arguments(stem, context_arguments) {
	const verb = context_arguments.get('Verb')
	const head_noun = context_arguments.get('Head Noun')
	const noun = context_arguments.get('Noun') || ''

	if (verb) {
		return `${verb} (${stem} ${noun})`
	} else if (head_noun) {
		return `(${head_noun} (${stem} ${noun}))`
	} else if (context_arguments.has('Clause')) {
		return `[${stem}... ]`
	} else {
		return stem
	}
}
