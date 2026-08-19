import Database from 'bun:sqlite'
import { load_examples } from './exhaustive_examples/load'
import { create_changes_table } from './changes'

// usage: `bun ontology/migrate.ts databases/Sources_YYYY-MM-DD.tabitha.sqlite databases/Ontology_VERSION_YYYY-MM-DD.tabitha.sqlite`
if (Bun.argv.length !== 4) {
	throw new Error('Usage: bun ontology/migrate.ts databases/Sources_YYYY-MM-DD.tabitha.sqlite databases/Ontology_VERSION_YYYY-MM-DD.tabitha.sqlite')
}
const tabitha_db_name = Bun.argv[3]	// databases/Ontology_VERSION_YYYY-MM-DD.tabitha.sqlite

const tabitha_db = new Database(tabitha_db_name, { create: false, readwrite: true })

// drastic perf improvement: https://www.sqlite.org/pragma.html#pragma_journal_mode
tabitha_db.run('PRAGMA journal_mode = WAL')

create_complex_terms_table(tabitha_db)

create_changes_table(tabitha_db)

const sources_db_name = Bun.argv[2]	// databases/Sources_YYYY-MM-DD.tabitha.sqlite
console.log(`[Ontology migration] Opening Sources database: ${sources_db_name}`)
const sources_db = new Database(sources_db_name)

const sources_db_complex_name = sources_db_name.replace('Sources', 'Sources_Complex')
console.log(`[Ontology migration] Opening Sources_Complex database: ${sources_db_complex_name}`)
const sources_db_complex = new Database(sources_db_complex_name, { readwrite: true, create: false })

await load_examples(tabitha_db, sources_db, sources_db_complex)

console.log(`Optimizing ${tabitha_db_name}...`)
tabitha_db.run('VACUUM')
console.log('done.')
tabitha_db.close()

function create_complex_terms_table(tabitha_db: Database) {
	tabitha_db.run(`
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
	`)
}

