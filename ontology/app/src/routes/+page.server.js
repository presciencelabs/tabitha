import {get_all_concepts, get_some_concepts} from '$lib/server/ontology'

/** @type {import('./$types').PageServerLoad} */
export async function load({url: {searchParams}}) {
	const query = searchParams.get('q') ?? ''

	/** @type {Concept[]} */
	let matches

	// prettier-ignore
	switch(query) {
		case ''	: matches = []								; break;
		case '*'	: matches = get_all_concepts()		; break;
		default	: matches = get_some_concepts(query)
	}

	return {
		matches,
	}
}
