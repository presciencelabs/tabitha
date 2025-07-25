/**
 * @param {{ ontology_id: number }} lookup 
 * @returns {boolean}
 */
function IS_IN_ONTOLOGY(lookup) {
	return lookup.ontology_id > 0
}

/**
 * @param {{ ontology_id: number, level: number }} lookup 
 * @returns {boolean}
 */
function IS_OR_WILL_BE_IN_ONTOLOGY(lookup) {
	return lookup.ontology_id > 0 || lookup.level > -1
}

/**
 * @param {string} part_of_speech 
 * @returns {(lookup: { part_of_speech: string }) => boolean}
 */
function IS_PART_OF_SPEECH(part_of_speech) {
	return lookup => lookup.part_of_speech.toLowerCase() === part_of_speech.toLowerCase()
}

/**
 * @param {number} level 
 * @returns {(lookup: { level: number }) => boolean}
 */
function IS_LEVEL(level) {
	return lookup => lookup.level === level
}

/**
 * @param {{ level: number }} lookup 
 * @returns {boolean}
 */
function IS_LEVEL_SIMPLE(lookup) {
	return [0, 1].includes(lookup.level)
}

/**
 * @param {{ level: number }} lookup 
 * @returns {boolean}
 */
function IS_LEVEL_COMPLEX(lookup) {
	return [2, 3].includes(lookup.level)
}

/**
 * 
 * @param {{ stem: string, part_of_speech: string }} lookup 
 * @returns {(lookup: { stem: string, part_of_speech: string }) => boolean}
 */
function MATCHES_LOOKUP({ stem, part_of_speech }) {
	return lookup => lookup.stem === stem && lookup.part_of_speech === part_of_speech
}

/**
 * 
 * @param {{ stem: string, sense: string }} lookup
 * @returns {(lookup: { stem: string, sense: string }) => boolean}
 */
function MATCHES_SENSE({ stem, sense }) {
	return lookup => lookup.stem === stem && lookup.sense === sense
}

/**
 * 
 * @param {string} argument 
 * @returns {(lookup: { case_frame: CaseFrame }) => boolean}
 */
function HAS_MISSING_ARGUMENT(argument) {
	return lookup => lookup.case_frame.result.missing_arguments.some(role_tag => role_tag.includes(argument))
}

/**
 * 
 * @param {string} argument 
 * @returns {(lookup: { case_frame: CaseFrame }) => boolean}
 */
function HAS_EXTRA_ARGUMENT(argument) {
	return lookup => lookup.case_frame.result.extra_arguments.some(({ role_tag }) => role_tag.includes(argument))
}

export const LOOKUP_FILTERS = {
	IS_IN_ONTOLOGY,
	IS_OR_WILL_BE_IN_ONTOLOGY,
	IS_PART_OF_SPEECH,
	IS_LEVEL,
	IS_LEVEL_SIMPLE,
	IS_LEVEL_COMPLEX,
	MATCHES_LOOKUP,
	MATCHES_SENSE,
	HAS_MISSING_ARGUMENT,
	HAS_EXTRA_ARGUMENT,
}
