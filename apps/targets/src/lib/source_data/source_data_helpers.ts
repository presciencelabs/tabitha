import type { SourceResult, Reference } from '@tabitha/types'

export function get_sources_url({
	reference: { type, id_primary, id_secondary, id_tertiary },
	sources_api_host,
}: {
	reference: Reference
	sources_api_host: string
}): string {
	return `${sources_api_host}/${type}/${id_primary}/${id_secondary}/${id_tertiary}`
}

export async function fetch_source_data({
	reference,
	sources_api_host,
	fetch_fn = fetch,
}: {
	reference: Reference
	sources_api_host: string
	fetch_fn?: typeof fetch
}): Promise<SourceResult> {
	const url = get_sources_url({ reference, sources_api_host })
	const response = await fetch_fn(url)
	return await response.json()
}
