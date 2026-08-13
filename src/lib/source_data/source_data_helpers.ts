import type { SourceData, SourceReference } from '$lib/types'

export function get_sources_url(
	{ type, id_primary, id_secondary, id_tertiary }: SourceReference,
	sources_api_host: string,
): string {
	return `${sources_api_host}/${type}/${id_primary}/${id_secondary}/${id_tertiary}`
}

export async function fetch_source_data(
	reference: SourceReference,
	sources_api_host: string,
	fetch_fn: typeof fetch = fetch,
): Promise<SourceData> {
	const url = get_sources_url(reference, sources_api_host)
	const response = await fetch_fn(url)
	return await response.json()
}
