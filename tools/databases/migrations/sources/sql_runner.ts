import type Database from 'bun:sqlite'

export type SqlParam = string | number

export type SqlRunner = {
	run(sql: string, params?: SqlParam[]): void
}

/** Executes each statement immediately against a local bun:sqlite database. */
export function bun_sqlite_runner(db: Database): SqlRunner {
	return {
		run(sql, params = []) {
			db.run(sql, params)
		},
	}
}

export type CollectedStatement = { sql: string, params: SqlParam[] }

/**
 * Records every statement instead of executing it, for callers that need to apply the same SQL
 * somewhere other than an in-process bun:sqlite handle (e.g. a live D1 database via `wrangler d1
 * execute --file`).
 */
export function collecting_sql_runner(): SqlRunner & { statements: CollectedStatement[] } {
	const statements: CollectedStatement[] = []

	return {
		statements,
		run(sql, params = []) {
			statements.push({ sql, params })
		},
	}
}

/** Renders collected statements as literal, D1-importable SQL text (no bound parameters). */
export function render_sql_file(statements: CollectedStatement[]): string {
	return statements.map(render_statement).join('\n')

	function render_statement({ sql, params }: CollectedStatement): string {
		let param_index = 0
		const with_literals = sql.replace(/\?/g, () => render_literal(params[param_index++]))
		return `${with_literals.trim()};`
	}

	function render_literal(value: SqlParam): string {
		if (typeof value === 'number') return String(value)
		return `'${value.replace(/'/g, "''")}'`
	}
}
