/**
 * @param {TransformedConcept[]} concepts
 *
 * @returns {AugmentedConcept[]}
 */
export function augment(concepts) {
	const augmented_concepts = add_senses(concepts)

	return augmented_concepts
}

/**
 * @param {TransformedConcept[]} concepts
 *
 * @returns {AugmentedConcept[]}
 */
function add_senses(concepts) {
	const sensed_concepts = []
	const sense_tracker = new Map()

	for (const concept of concepts.sort(by_id)) {
		const {roots} = concept

		if (!sense_tracker.has(roots)) {
			sense_tracker.set(roots, 'A')
		}

		const sense = sense_tracker.get(roots)

		sensed_concepts.push({
			...concept,
			sense,
		})

		sense_tracker.set(roots, next_sense(sense))
	}

	return sensed_concepts

	/**
	 * @param {TransformedConcept} a
	 * @param {TransformedConcept} b
	 *
	 * @returns {number}
	 */
	function by_id(a, b) {
		return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
	}

	/**
	 * @param {string} sense - a single character that started with 'A'
	 *
	 * @returns {string} - the next character in the alphabet
	 */
	function next_sense(sense) {
		return String.fromCharCode(sense.charCodeAt(0) + 1)
	}
}
