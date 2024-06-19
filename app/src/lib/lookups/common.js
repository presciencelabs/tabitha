/**
 * @param {LookupWord} lookup1
 * @param {LookupWord} lookup2
 * @returns {boolean}
 */
export function lookups_match(lookup1, lookup2) {
	return lookup1.stem === lookup2.stem && lookup1.part_of_speech === lookup2.part_of_speech
}

/**
 * @param {LookupResult} lookup 
 * @param {HowToResult} how_to_result 
 * @returns {boolean}
 */
export function senses_match(lookup, how_to_result) {
	return lookup.concept?.sense === how_to_result.sense
		|| lookup.how_to.some(result => result.sense === how_to_result.sense)
}