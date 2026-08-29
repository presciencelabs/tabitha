import Database from 'bun:sqlite'
import { load_examples } from './exhaustive_examples/load'
import { create_changes_table } from './changes'
import { create_logger } from '../log'

const log = create_logger('Ontology migration')

// usage: `bun ontology/migrate.ts raw/Sources_YYYY-MM-DD.tabitha.sqlite raw/Sources_Complex_YYYY-MM-DD.tabitha.sqlite raw/Ontology_VERSION_YYYY-MM-DD.tabitha.sqlite`
const USAGE = 'Usage: bun ontology/migrate.ts raw/Sources_YYYY-MM-DD.tabitha.sqlite raw/Sources_Complex_YYYY-MM-DD.tabitha.sqlite raw/Ontology_VERSION_YYYY-MM-DD.tabitha.sqlite'
if (Bun.argv.length !== 5) {
	throw new Error(USAGE)
}

const sources_db_name = Bun.argv[2]	// raw/Sources_YYYY-MM-DD.tabitha.sqlite
const sources_db_complex_name = Bun.argv[3]	// raw/Sources_Complex_YYYY-MM-DD.tabitha.sqlite -- resolved by the planner, may be an older date than sources_db_name
const tabitha_db_name = Bun.argv[4]	// raw/Ontology_VERSION_YYYY-MM-DD.tabitha.sqlite
if (!sources_db_name || !sources_db_complex_name || !tabitha_db_name) {
	throw new Error(USAGE)
}

const tabitha_db = new Database(tabitha_db_name, { create: false, readwrite: true })

// drastic perf improvement: https://www.sqlite.org/pragma.html#pragma_journal_mode
tabitha_db.run('PRAGMA journal_mode = WAL')

create_complex_terms_table(tabitha_db)

create_changes_table(tabitha_db)

log.step(`Opening Sources database: ${sources_db_name}`)
const sources_db = new Database(sources_db_name, { readwrite: true, create: false })

log.step(`Opening Sources_Complex database: ${sources_db_complex_name}`)
const sources_db_complex = new Database(sources_db_complex_name, { readwrite: true, create: false })

await load_examples(tabitha_db, sources_db, sources_db_complex)

log.step(`Optimizing ${tabitha_db_name}...`)
tabitha_db.run('VACUUM')
tabitha_db.close()

log.summary()

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

