/**
 * @param {import('@cloudflare/workers-types').D1Database} db
 * @returns {(terms: ComplexTerm[]) => Promise<void>}
 */
export const load = db => async function(terms) {
	// https://developers.cloudflare.com/d1/build-databases/query-databases
	db.prepare(`
		CREATE TABLE IF NOT EXISTS Complex_Terms (
			'term' 				TEXT,
			'part_of_speech' 	TEXT,
			'pairing' 			TEXT,
			'explication' 		TEXT
		)
	`).run()

	const clear_stmt = db.prepare('DELETE FROM Complex_Terms')
	const insert_stmt = db.prepare('INSERT INTO Complex_Terms VALUES (?, ?, ?, ?)')
	const insert_stmts = terms.map(({term, part_of_speech, pairing, explication}) => insert_stmt.bind(term, part_of_speech, pairing, explication))

	console.log('updating table with latest data')

	// https://developers.cloudflare.com/d1/build-databases/query-databases/#batch-statements
	await db.batch([
		clear_stmt,
		...insert_stmts,
	])

	console.log('done!')
}
