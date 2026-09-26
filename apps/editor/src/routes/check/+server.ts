import { json } from '@sveltejs/kit'
import { run_check, run_check_with_auto_fixes } from '$lib/server/check'

import type { RequestEvent } from './$types'

export async function GET({ url: { searchParams } }: RequestEvent) {
	const text = searchParams.get('text') ?? ''
	const check = searchParams.get('auto_fix') === 'on' ? run_check_with_auto_fixes : run_check

	return json(await check(text))
}
