import { PUBLIC_TARGETS_API_HOST, PUBLIC_SOURCES_API_HOST } from '$env/static/public'

export async function fetch_encoding(verse_ref: Reference): Promise<SourceApiResult|undefined> {
	const { book, chapter, verse } = verse_ref
	const response = await fetch(`${PUBLIC_SOURCES_API_HOST}/Bible/${book}/${chapter}/${verse}/simple-json?glosses=true`)
	if (!response.ok) {
		return undefined
	}
	return await response.json() as SourceApiResult
}

export async function fetch_target_text(verse_ref: Reference, project: string, preferred_audience: string): Promise<TargetApiResult|undefined> {
	const { book, chapter, verse } = verse_ref
	const response = await fetch(`${PUBLIC_TARGETS_API_HOST}/${project}/${book}/${chapter}/${verse}`)
	if (!response.ok) {
		return undefined
	}
	const results = await response.json() as TargetApiResult[]
	return results.find(res => res.audience === preferred_audience) || results.at(0)
}

