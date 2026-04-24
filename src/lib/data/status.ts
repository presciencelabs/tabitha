import type { D1Database } from '@cloudflare/workers-types'

interface StatusCountResult {
	not_started_count: number
	in_progress_count: number
	initial_complete_count: number
	review_count: number
	ready_count: number
	total_count: number
}

export async function get_book_status(db: D1Database, reference: StatusRequestReference): Promise<StatusResult> {
	const sql = `
		SELECT
			COUNT(*) FILTER (WHERE status = 'Not Started') AS not_started_count,
			COUNT(*) FILTER (WHERE status = 'Initial Analysis in Progress') AS in_progress_count,
			COUNT(*) FILTER (WHERE status = 'Initial Analysis Complete') AS initial_complete_count,
			COUNT(*) FILTER (WHERE status = 'Final Review in Progress') AS review_count,
			COUNT(*) FILTER (WHERE status = 'Ready to Translate') AS ready_count,
			COUNT(*) AS total_count
		FROM Sources
		WHERE type LIKE ?
			AND id_primary LIKE ?
	`

	const result = await db.prepare(sql).bind(reference.type, reference.id_primary).first<StatusCountResult>()
	return {
		reference,
		status: get_status_from_counts(result),
	}
}

export async function get_chapter_status(db: D1Database, reference: StatusRequestReference): Promise<StatusResult> {
	const sql = `
		SELECT
			COUNT(*) FILTER (WHERE status = 'Not Started') AS not_started_count,
			COUNT(*) FILTER (WHERE status = 'Initial Analysis in Progress') AS in_progress_count,
			COUNT(*) FILTER (WHERE status = 'Initial Analysis Complete') AS initial_complete_count,
			COUNT(*) FILTER (WHERE status = 'Final Review in Progress') AS review_count,
			COUNT(*) FILTER (WHERE status = 'Ready to Translate') AS ready_count,
			COUNT(*) AS total_count
		FROM Sources
		WHERE type LIKE ?
			AND id_primary LIKE ?
			AND id_secondary = ?
	`

	const prepared_statement = db.prepare(sql).bind(reference.type, reference.id_primary, reference.id_secondary!.toString())
	const result = await prepared_statement.first<StatusCountResult>()
	return {
		reference,
		status: get_status_from_counts(result),
	}
}

function get_status_from_counts(status_counts: StatusCountResult|null): SourceStatus {
	const status_count_mapping: [(status_counts: StatusCountResult) => boolean, SourceStatus][] = [
		[({ total_count, ready_count }) => total_count === ready_count, 'Ready to Translate'],
		[({ total_count, not_started_count }) => total_count === not_started_count, 'Not Started'],
		[({ not_started_count }) => not_started_count > 0, 'Initial Analysis in Progress'],
		[({ in_progress_count }) => in_progress_count > 0, 'Initial Analysis in Progress'],
		[({ review_count }) => review_count > 0, 'Final Review in Progress'],
		[() => true, 'Initial Analysis Complete'],
	]

	return status_counts ? status_count_mapping.find(([predicate]) => predicate(status_counts))![1] : 'Not Started'
}

export async function get_verse_statuses(db: D1Database, references: Reference[]): Promise<StatusResult[]> {
	const sql = `
		SELECT status
		FROM Sources
		WHERE type LIKE ?
			AND id_primary LIKE ?
			AND id_secondary = ?
			AND id_tertiary = ?
	`

	const prepared_statement = db.prepare(sql)
	const bound_statements = references.map(({ type, id_primary, id_secondary, id_tertiary }) =>
		prepared_statement.bind(type, id_primary, id_secondary.toString(), id_tertiary.toString()),
	)

	const batch_result = await db.batch<{ status: SourceStatus }>(bound_statements)
	const statuses = batch_result.map(r => r.results[0]?.status || 'Not Started')

	const results = references.map((reference, i) => ({
		reference,
		status: statuses[i],
	}))
	return results
}