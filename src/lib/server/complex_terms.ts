import type { D1Database } from '@cloudflare/workers-types'

export type TabSeparatedValues = string

export type ComplexTerm = {
	stem: string
	sense: string
	part_of_speech: string
	structure: string
	pairing: string
	explication: string
	ontology_status: string
	level: number
	notes: string
}

export const CREATE_COMPLEX_TERMS_TABLE_SQL = `
	CREATE TABLE IF NOT EXISTS Complex_Terms (
		'stem' 				TEXT,
		'sense'				TEXT,
		'part_of_speech' 	TEXT,
		'structure'		 	TEXT,
		'pairing' 			TEXT,
		'explication' 		TEXT,
		'ontology_status'	TEXT,
		'level'				INTEGER,
		'notes'				TEXT
	)
`

export const INSERT_COMPLEX_TERMS_SQL = `
	INSERT INTO Complex_Terms (stem, sense, part_of_speech, structure, pairing, explication, ontology_status, level, notes)
	VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`

export function transform(rows: TabSeparatedValues[]): ComplexTerm[] {
	return rows.map((row: TabSeparatedValues) => {
		const [term, part_of_speech, structure, pairing, explication, ontology_status, level, notes] = row.split('\t')
		// Splits the raw source string into a stem block and single-character uppercase sense block (e.g. "love-A" -> [stem: "love", sense: "A"])
		const term_match = (term ?? '').trim().match(/^(.*)-([A-Z])$/)
		const [stem, sense] = term_match ? [term_match[1], term_match[2]] : [term, '']

		// Strips out purely numerical level values (e.g. "level 2" -> 2)
		const level_match = (level ?? '').trim().match(/^level (\d)$/)
		const level_int = level_match ? parseInt(level_match[1]) : -1

		return {
			stem,
			sense,
			part_of_speech: capitalize(part_of_speech),
			structure,
			pairing,
			explication,
			ontology_status,
			level: level_int,
			notes,
		}
	})

	function capitalize(text: string) {
		const REGEX_FIRST_CHARACTER = /^./

		return (text ?? '')
			.trim()
			.toLowerCase()
			.replace(REGEX_FIRST_CHARACTER, c => c.toUpperCase())
	}
}

export async function extract(): Promise<TabSeparatedValues[]> {
	console.info('fetching latest complex terms spreadsheet data')

	const response = await fetch(
		'https://docs.google.com/spreadsheets/d/16_U4MqhwHNd9fR9Ai5ZeAI4AzBFGEAi3KhNyMQbEHlM/export?format=tsv&gid=0',
	)

	if (!response.ok) {
		throw new Error(`Failed to fetch complex terms sheet: ${response.status} ${response.statusText}`)
	}

	const raw_data = await response.text()

	// skip first three rows (headers)
	const [, , , ...rows] = raw_data.split(/\r?\n/)

	console.info(`received ${rows.length} rows from spreadsheet`)

	return rows
}

export async function sync_complex_terms(db: D1Database): Promise<number> {
	const extracted_rows = await extract()

	if (extracted_rows.length < 1) {
		console.info('No rows extracted from spreadsheet.')
		return 0
	}

	const terms = transform(extracted_rows)

	// Ensure table exists
	await db.prepare(CREATE_COMPLEX_TERMS_TABLE_SQL).run()

	const clear_stmt = db.prepare('DELETE FROM Complex_Terms')
	const insert_stmt = db.prepare(INSERT_COMPLEX_TERMS_SQL)
	const insert_stmts = terms.map(
		({ stem, sense, part_of_speech, structure, pairing, explication, ontology_status, level, notes }) =>
			insert_stmt.bind(stem, sense, part_of_speech, structure, pairing, explication, ontology_status, level, notes),
	)

	console.info(`Updating Complex_Terms table with ${terms.length} terms...`)

	await db.batch([clear_stmt, ...insert_stmts])

	const count = await db.prepare('SELECT COUNT(*) AS count FROM Complex_Terms').first<number>('count')
	const total_terms = count ?? terms.length

	console.info(`Successfully updated ${total_terms} complex terms in D1 database.`)
	return total_terms
}
