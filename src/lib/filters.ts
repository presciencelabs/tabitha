
/**
 * @param {Concept} concept 
 */
function IS_IN_ONTOLOGY(concept) {
	return concept.status === 'in ontology'
}

/**
 * @param {Concept} concept 
 */
function IS_OR_WILL_BE_IN_ONTOLOGY(concept) {
	return ['in ontology', 'approved'].includes(concept.status)
}

/**
 * @param {Concept} concept 
 */
function IS_COMPLEX(concept) {
	return ['2', '3'].includes(concept.level)
}


export const CONCEPT_FILTERS = {
	IS_IN_ONTOLOGY,
	IS_OR_WILL_BE_IN_ONTOLOGY,
	IS_COMPLEX,
}