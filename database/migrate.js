import {Database} from 'bun:sqlite'

const tabitha_db_name = Bun.argv.at(-1)
const tbta_sources_from_input = Bun.argv.slice(2, -1)

const tabitha_sources_db = new Database(tabitha_db_name)

console.log(`Prepping Sources table in ${tabitha_db_name}...`)
tabitha_sources_db.query(`
	CREATE TABLE IF NOT EXISTS Sources (
		'type', -- e.g., Bible, Grammar Introduction, Community Development Texts
		'id_primary', -- for Bible, this would hold the book name, e.g., Genesis
		'id_secondary', -- for Bible, this would hold the chapter, e.g., 1
		'id_tertiary', -- for Bible, this would hold the verse, e.g., 1
		'phase_1_encoding',
		'semantic_encoding',
		'notes'
	)
`).run()
tabitha_sources_db.query(`
	DELETE FROM Sources
`).run()
console.log('done.')

tbta_sources_from_input.map(tbta_source_from_input => {
	console.log(`Extracting relevant table names from ${tbta_source_from_input}...`)
	const tbta_db = new Database(tbta_source_from_input)
	const tbta_source_name = tbta_source_from_input.split('.')[0]

	// https://bun.sh/docs/api/sqlite#reference
	const tbta_source_tablenames = tbta_db.query(`
		SELECT *
		FROM sqlite_master
		WHERE type = 'table'
			AND name != 'Version'
	`).all().map(({name}) => name)

	tbta_source_tablenames.map(tbta_table_name => {
		const tbta_data_rows_per_table = tbta_db.query(`
			SELECT '${tbta_source_name}' AS Source, Reference, Verse, AnalyzedVerse, Notes
			FROM '${tbta_table_name}'
		`).all()

		console.log()
		console.log(`transforming data from ${tbta_table_name} and inserting into ${tabitha_db_name}:`)
		const inserted_rows = tbta_data_rows_per_table
			.filter(({Reference}) => !!Reference) // excludes those rows populed with `NULL` (for some reason)
			.map(async tbta_row => {
				const {Source, Reference, Verse, AnalyzedVerse, Notes} = tbta_row

				// transforms something like "Community_Development_Texts" into "Community Development Texts"
				const type = Source.replaceAll('_', ' ')

				// Reference looks like this: "Daniel 3:9" or "1_Chronicles 1:1"
				const [, id_primary, id_secondary, id_tertiary] = /(.*) (\d+):(\d+)/.exec(Reference) ?? [,'', 0, 0]

				const phase_1_encoding = Verse ?? ''
				const semantic_encoding = AnalyzedVerse ?? ''
				const notes = Notes ?? ''

				tabitha_sources_db.query(`
					INSERT INTO Sources
					VALUES (?, ?, ?, ?, ?, ?, ?)
				`).run(type, id_primary, id_secondary, id_tertiary, phase_1_encoding, semantic_encoding, notes)

				await Bun.write(Bun.stdout, '.')
		})

		console.log(`${inserted_rows.length} rows inserted.`)
	})
})
console.log()
console.log('done.')

console.log(`Optimizing ${tabitha_db_name}...`)
tabitha_sources_db.query(`
	VACUUM
`).run()
console.log('done.')
