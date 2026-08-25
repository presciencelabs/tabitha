import { json } from '@sveltejs/kit'
import { run_check } from '$lib/server/check'

import type { RequestEvent } from './$types'

export async function GET({ url: { searchParams } }: RequestEvent) {
	const text = searchParams.get('text') ?? ''

	return json(await run_check(text))
}
