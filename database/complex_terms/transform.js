/**
 * @typedef {string} TabSeparatedValues
 * @param {TabSeparatedValues[]} rows
 *
 * @typedef {Object} ComplexTerm
 * @property {string} term
 * @property {string} part_of_speech
 * @property {string} structure
 * @property {string} pairing
 * @property {string} explication
 *
 * @return {ComplexTerm[]}
 */
export function transform(rows) {
	return rows.map(row => {
		const [term, part_of_speech, structure, pairing, explication,] = row.split('\t')

		return {
			term,
			part_of_speech,
			structure,
			pairing,
			explication,
		}
	})
}
