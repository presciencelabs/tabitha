import { get_source_data } from '$lib/data/read'
import { transform_semantic_encoding } from '$lib/encoding/semantic_encoding'
import { simplify_encoding } from '$lib/encoding/simplify'
import { strip_gloss_classifiers } from '@tabitha/types'
import { error, json } from '@sveltejs/kit'
import { PUBLIC_ONTOLOGY_API_HOST } from '$env/static/public'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ locals: { db }, params: { type, id_primary, id_secondary, id_tertiary }, url: { searchParams } }) => {
	const include_glosses = searchParams.get('glosses') === 'true'

	const reference: Reference = { type, id_primary, id_secondary, id_tertiary }
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

async function fetch_glosses(entities: SourceEntity[]): Promise<Record<string, string>> {
	const concept_keys = [...new Set(entities.filter(entity => !!entity.concept).map(({ concept, category }) => `${concept?.stem}-${concept?.sense}&&${category}`))]

	const all_glosses: [string, string][] = await Promise.all(concept_keys.filter(key => !key.startsWith('-')).map(async key => {
		const [concept, category] = key.split('&&')
		const gloss = await fetch_concept_gloss(concept, category)
		return [`${concept}-${category}`, gloss]
	}))
	return Object.fromEntries(all_glosses.filter(entry => entry[1].length))
}

async function fetch_concept_gloss(concept: string, category: string): Promise<string> {
	const response = await fetch(`${PUBLIC_ONTOLOGY_API_HOST}/search?q=${concept}&category=${category}`)
	if (!response.ok) {
		return ''
	}
	const result: OntologyResult[] = await response.json()
	const gloss = result.length ? result[0].gloss : ''
	return strip_gloss_classifiers(gloss)
}
