import Database from 'bun:sqlite'
import { basename } from 'path'

export function migrate_source_texts(tabitha_sources_db: Database, tbta_sources_from_input: string[]) {
	console.log(`Prepping Sources table in ${tabitha_sources_db.filename}...`)
	tabitha_sources_db.run(`
		CREATE TABLE IF NOT EXISTS Sources (
			'type', -- e.g., Bible, Grammar Introduction, Community Development Texts
			'id_primary', -- for Bible, this would hold the book name, e.g., Genesis
			'id_secondary', -- for Bible, this would hold the chapter, e.g., 1
			'id_tertiary', -- for Bible, this would hold the verse, e.g., 1
			'phase_1_encoding',
			'semantic_encoding',
			'status',
			'notes'
		)
	`)
	tabitha_sources_db.run(`
		DELETE FROM Sources
	`)
	console.log('done.')

	tbta_sources_from_input.map(tbta_source_from_input => {
		console.log(`Extracting relevant table names from ${tbta_source_from_input}...`)
		const tbta_db = new Database(tbta_source_from_input, { readwrite: true, create: false }) // databases/Bible_YYYY-MM-DD.tbta.sqlite
		// Safely extract just the source identity prefix out of the filename (i.e. 'databases/Bible_YYYY-MM-DD...' -> 'Bible')
		const tbta_source_name = basename(tbta_source_from_input).split('_')[0]

		// https://bun.sh/docs/api/sqlite#reference
		const tbta_source_tablenames = tbta_db.query<{ name: string }, []>(`
			SELECT name
			FROM sqlite_master
			WHERE type = 'table'
				AND name != 'Version'
		`).all().map(({ name }) => name)

		tbta_source_tablenames.map(tbta_table_name => {
			type SourceRow = {
				Source: string
				Reference: string
				Verse: string
				AnalyzedVerse: string
				Notes: string
			}
			const tbta_data_rows_per_table = tbta_db.query<SourceRow, []>(`
				SELECT '${tbta_source_name}' AS Source, Reference, Verse, AnalyzedVerse, Notes
				FROM '${tbta_table_name}'
			`).all()

			console.log()
			console.log(`transforming data from ${tbta_table_name} and inserting into ${tabitha_sources_db.filename}:`)
			// Map the raw TBTA data rows into our normalized schema
			const valid_rows = tbta_data_rows_per_table.filter(({ Reference }) => !!Reference)
			
			for (const tbta_row of valid_rows) {
				const { Source, Reference, Verse, AnalyzedVerse, Notes } = tbta_row

				// transforms something like "Community_Development_Texts" into "Community Development Texts"
				const type = Source.replaceAll('_', ' ')

				// Extract Book, Chapter, and Verse integers out of legacy reference strings -> (e.g. "Daniel 3:9" -> ["Daniel", "3", "9"])
				const [, id_primary, id_secondary, id_tertiary] = /(.*) (\d+):(\d+)/.exec(Reference) ?? [, '', 0, 0]

				// As of Jul '26, TBTA is allowing whitespace garbage in, so these defensive techniques are being used to clean the data up before entering Tabitha's tables.
				const phase_1_encoding = (Verse ?? '').trim()
				const semantic_encoding = AnalyzedVerse ?? ''
				const notes = (Notes ?? '').replace(/\r/g, '').trim()

				tabitha_sources_db.run(`
					INSERT INTO Sources
					VALUES (?, ?, ?, ?, ?, ?, '', ?)
				`, [type, id_primary, id_secondary, id_tertiary, phase_1_encoding, semantic_encoding, notes])
			}

			console.log(`\n${valid_rows.length} rows inserted.`)
		})
	})

	console.log()
	console.log('done.')
}