import { json } from '@sveltejs/kit'
import { get_request_caller, record_usage_event } from '@tabitha/usage'
import { run_check } from '$lib/server/check'
import { to_check_event } from '$lib/server/usage'

import type { RequestEvent } from './$types'

export async function GET({ url: { searchParams }, request, platform }: RequestEvent) {
	const text = searchParams.get('text') ?? ''

	const result = await run_check(text)

	if (text.trim()) {
		record_usage_event({ dataset: platform?.env.USAGE, app: 'editor', event: to_check_event({ result, caller: get_request_caller(request) }) })
	}

	return json(result)
}
