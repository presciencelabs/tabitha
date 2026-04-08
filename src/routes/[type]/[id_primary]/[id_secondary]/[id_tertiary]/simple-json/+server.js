// https://kit.svelte.dev/docs/routing#server
import { get_source_data } from '$lib/data/read'
import { transform_semantic_encoding } from '$lib/encoding/semantic_encoding'
import { simplify_encoding } from '$lib/encoding/simplify'
import { error, json } from '@sveltejs/kit'
import { PUBLIC_ONTOLOGY_API_HOST } from '$env/static/public'

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals: { db }, params: { type, id_primary, id_secondary, id_tertiary }, url: { searchParams } }) {
	/** @type {boolean} */
	const include_glosses = searchParams.get('glosses') === 'true'

	const reference = { type, id_primary, id_secondary, id_tertiary }
	const source = await get_source_data(db, reference)

	if (!source) {
		error(404, 'Unknown source reference.')
	}
	
	const encoding = await transform_semantic_encoding(db, source.semantic_encoding)
	const simple_encoding = simplify_encoding(encoding)

	if (include_glosses) {
		const glosses = await fetch_glosses(encoding)
		return json({ encoding: simple_encoding, glosses })
	}

	return json({ encoding: simple_encoding })
}

/**
 * 
 * @param {SourceEntity[]} entities 
 * @returns {Promise<Record<string, string>>}
 */
async function fetch_glosses(entities) {
	const concept_keys = [...new Set(entities.filter(entity => !!entity.concept).map(({ concept, category }) => `${concept?.stem}-${concept?.sense}&&${category}`))]

	// I don't think we need the glosses for the functional adpositions/particles (which start with '-') like -QuoteBegin, -MadeOf, etc
	/** @type {[string, string][]} */
	const all_glosses = await Promise.all(concept_keys.filter(key => !key.startsWith('-')).map(async key => {
		const [concept, category] = key.split('&&')
		const gloss = await fetch_concept_gloss(concept, category)
		return [`${concept}-${category}`, gloss]
	}))
	return Object.fromEntries(all_glosses.filter(entry => entry[1].length))
}

/**
 * 
 * @param {string} concept 
 * @param {string} category 
 * @returns {Promise<string>}
 */
async function fetch_concept_gloss(concept, category) {
	const response = await fetch(`${PUBLIC_ONTOLOGY_API_HOST}/search?q=${concept}&category=${category}`)
	if (!response.ok) {
		return ''
	}
	/** @type {OntologyResult[]} */
	const result = await response.json()
	const gloss = result.length ? result[0].gloss : ''
	return gloss.replace(/\((universal primitive|LDV|complex|complex alternate|inexplicable)\) /, '')
}
