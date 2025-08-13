import { bible_books } from '$lib/lookups'

/** @type { ContextArgumentMap } */
export const context_argument_map = new Map([
	['Noun', [
		'Pairing',
		'Role',
		'Verb',
		'Adposition',
		'Outer Noun',
		'Outer Adjective',
		'Outer Adverb',
	]],
	['Verb', [
		'Pairing',
		'Agent',
		'Patient',
		'State',
		'Source',
		'Destination',
		'Instrument',
		'Beneficiary',
		'Predicate Adjective',
		'Propositional Agent',
		'Propositional Patient',
		'Topic NP',
		'Polarity',
	]],
	['Adjective', [
		'Pairing',
		'Usage',
		'Agent',
		'Verb',
		'Modified Noun',
		'Modified Adjective',
		'Patient Noun',
		'Patient Clause',
		'Degree',
	]],
	['Adverb', [
		'Pairing',
		'Verb',
		'Modified Noun',
		'Modified Adjective',
		'Degree',
	]],
	['Adposition', [
		'Noun',
		'Verb',
		'Adjective',
		'Outer Noun',
		'Outer Adjective',
	]],
])

/**
 * Example data:
 * ______________________________________________
 * | Name			| Options 							|
 * | ------------	| --------------------------- |
 * | Book			| Genesis, Exodus, ...			|
 *
 *    ============= person-B ================
 * | Verb			| 'tell-D', 'send-A', ...		|
 * | Role			| 'agent-A', 'state-A', ...	|
 *
 *    ============= person-A ================
 * | Verb			| ...									|
 * | Role			| ...									|
 * | Adposition	| ...									|
 * | Outer Nouns	| ...									|
 *
 *    ============= sleep-A ================
 * | Topic NP		| 'Most Agent-Like'				|
 * | Polarity		| 'Affirmative', 'Negative'	|
 * | Agent			| ...									|
 * | Addressee		| ...									|
 *
 *    ============= speak-A ================
 * | Topic NP		| ...				|
 * | Polarity		| 'Affirmative', 'Negative'	|
 * | Agent			| ...									|
 * | Patient		| ...									|
 * | ...				| ...									|
 *
 *    ============= speak-B ================
 * | Topic NP		| 'Most Agent-Like'				|
 * | Polarity		| 'Affirmative'					|
 * | Agent			| ...									|
 * | Patient		| ...									|
 *
 * @param { Concept } concept
 * @param { Example[] } examples
 * @returns { FilterMap }
 */
export function derive_filters(concept, examples) {
	/** @type { FilterMap } */
	const filters = new Map()

	// The Book filter has to be handled separately because it's a little different than the context filters.
	const book_names_found_in_examples = examples.sort(by_book_order).map(book_name)
	filters.set('Book', new Set(['Any', ...book_names_found_in_examples]))

	/** @type { FilterMap } */
	const context_filters = initialize_filter_map().get(concept.part_of_speech) ?? new Map()

	/**
	 * @typedef { number } Counter
	 * @type { Record<ContextArgumentName, Counter> }
	 */
	const absence_tracker = {}

	examples.forEach(({ context }) => {
		context_filters.forEach((options, argument_name) => {
			if (context[argument_name]) {
				context_filters.get(argument_name)?.add(context[argument_name])
			}
			else {
				absence_tracker[argument_name] = (absence_tracker[argument_name] ?? 0) + 1
			}
		})
	})

	for (const [name, options] of context_filters.entries().filter(has_options)) {
		const common_options = new Set()

		// second condition added because take-A [Instrument and Addressee] both have only one option...
		if (options.size > 1 || absence_tracker[name] && options.size === 1) {
			common_options.add('Any')
		}

		if (absence_tracker[name]) {
			common_options.add('Present')
			common_options.add('Not present')
		}

		const sorted_options = [...options].sort()

		filters.set(name, new Set([...common_options, ...sorted_options]))
	}

	return filters

	/** @param { Example } example */
	function book_name({ reference: { id_primary } }) {
		return id_primary
	}

	function initialize_filter_map() {
		/** @type { FilterRulesMap } */
		const filter_rules_map = new Map()

		for (const [part_of_speech, args] of context_argument_map.entries()) {
			/** @type { FilterMap } */
			const filter_map = new Map()

			for (const filter_name of args) {
				/** @type { Options } */
				const options = new Set()

				filter_map.set(filter_name, options)
			}

			filter_rules_map.set(part_of_speech, filter_map)
		}

		return filter_rules_map
	}

	/** @param { [ContextArgumentName, Options] } filter_map  */
	function has_options([, options]) {
		return options.size > 0
	}
}

/**
 * Sorts by Bible book order rather than the natural alphabetical order
 *
 * @param { Example } example_1
 * @param { Example } example_2
 * @returns { number }
 */
export function by_book_order({ reference: { id_primary: book_name_1 } }, { reference: { id_primary: book_name_2 } }) {
	const books_in_order = Object.values(bible_books)

	const index_1 = books_in_order.indexOf(book_name_1)
	const index_2 = books_in_order.indexOf(book_name_2)

	return index_1 - index_2
}
