import { PUBLIC_ONTOLOGY_API_HOST } from '$env/static/public'

/**
 * @param {SourceConcept} concept
 * @returns {Promise<OntologyResult[]>}
 */
export async function fetch_ontology_data_for_all_senses(concept) {
	const { stem, part_of_speech } = concept
	const response = await fetch(`${PUBLIC_ONTOLOGY_API_HOST}/search?q=${stem}&category=${part_of_speech}`)

	if (!response.ok) {
		return []
	}

	/** @type {OntologyResult[]} */
	const results = await response.json()
	
	// Use the result that exactly matches the original stem (eg. "lot" vs "Lot")
	return results.filter(result => result.stem === stem)
}