import { ontology as temp_ontology } from '$data/ontology'

/** @type {import('./$types').PageLoad} */
export async function load({ url: { searchParams } }) {
	const query = searchParams.get('query')
	
	/** @type {import('$data/ontology').Concept[]} */
	let matches

	switch (query) {
		case ''	: matches = temp_ontology	; break;
		case null: matches = []					; break;
		default	: matches = temp_ontology.filter(concept => concept.stem.includes(query))
	}

	return {
		matches,
	}
}