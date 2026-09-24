import { error, redirect } from '@sveltejs/kit'
import { search_phase_1 } from '$lib/data/phase_1_search'
import { is_reference_query, parse_reference } from '$lib/data/ref_parser'
import type { PageServerLoad } from './$types'

export async function load({ locals: { db }, url: { searchParams } }: Parameters<PageServerLoad>[0]) {
	const q = searchParams.get('q')?.trim() ?? ''

	if (is_reference_query(q)) {
		const parsed_ref = parse_reference(q)
		if (!parsed_ref) {
			error(400, 'Invalid reference format. Must be in the format "(book) (chapter):(verse)", "(book) (chapter)", or "(book)"')
		}
		const { type, id_primary, id_secondary, id_tertiary } = parsed_ref

		redirect(303, `/${type}/${id_primary}/${id_secondary}/${id_tertiary}`)
	}

	return {
		q,
		results: await search_phase_1({ db, q }),
	}
}
