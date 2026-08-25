import type { OntologyChange } from '$lib/types'

// fetch()'s res.json() leaves dates as strings, unlike SvelteKit's own load-data serialization, which revives them automatically.
function revive_dates(raw: OntologyChange): OntologyChange {
	return {
		...raw,
		suggested_by: raw.suggested_by && { ...raw.suggested_by, date: new Date(raw.suggested_by.date) },
		approved_by: raw.approved_by && { ...raw.approved_by, date: new Date(raw.approved_by.date) },
		applied_date: raw.applied_date && new Date(raw.applied_date),
	}
}

export async function approve_change(id: number): Promise<OntologyChange> {
	const res = await fetch(`/protected/changes/${id}/approve`, { method: 'POST' })
	const result = await res.json()

	if (!res.ok) {
		throw new Error(result.message || 'Failed to approve the change.')
	}

	return revive_dates(result.change)
}

export type ApplyPendingResult = {
	count: number
	failed: number
	version: string
	timestamp: Date
	changes: OntologyChange[]
}

export async function apply_pending_changes(): Promise<ApplyPendingResult> {
	const res = await fetch('/protected/changes/apply-pending', { method: 'POST' })
	const result = await res.json()

	if (!res.ok) {
		throw new Error(result.message || 'Failed to apply pending changes.')
	}

	return {
		count: result.count,
		failed: result.failed,
		version: result.version,
		timestamp: new Date(result.timestamp),
		changes: result.changes.map(revive_dates),
	}
}
