import type { AnalysisResult } from '$lib/types'

export async function fetch_analysis(text: string): Promise<AnalysisResult> {
	const response = await fetch(`/analyze?text=${text}`)
	if (!response.ok) {
		throw new Error(`Analyze API returned HTTP ${response.status}`)
	}
	return await response.json() as AnalysisResult
}
