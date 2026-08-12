import { error, redirect } from '@sveltejs/kit'
import { parse_reference } from '$lib/data/ref_parser'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url: { searchParams } }) => {
	const ref = searchParams.get('ref') ?? ''

	const parsed_ref = parse_reference(ref)
	if (!parsed_ref) {
		error(400, 'Invalid reference format. Must be in the format "(book) (chapter):(verse)", "(book) (chapter)", or "(book)"')
	}
	const { type, id_primary, id_secondary, id_tertiary } = parsed_ref

	return redirect(303, `/${type}/${id_primary}/${id_secondary}/${id_tertiary}`)
}
