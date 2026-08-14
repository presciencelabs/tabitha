import { analyze } from '$lib/analyzer'
import { parse } from '$lib/parser'
import { json } from '@sveltejs/kit'

import type { RequestEvent } from './$types'

export async function GET({ url: { searchParams } }: RequestEvent) {
	const text = searchParams.get('text') ?? ''

	const sentences = await parse(text)
	const source_data = analyze(sentences)

	return json(source_data)
}