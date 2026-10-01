import type { Database } from 'bun:sqlite'
import { CREATE_COMPLEX_TERMS_TABLE_SQL, INSERT_COMPLEX_TERMS_SQL, fetch_complex_terms } from '@tabitha/complex-terms'
import { create_logger } from '../log'

const log = create_logger('Ontology migration')

// Drops whatever Complex_Terms table the TBTA export shipped (not a reliable copy of the sheet --
// see @tabitha/complex-terms) and rebuilds it the same way apps/ontology's scheduled sync does.
export async function load_complex_terms(tabitha_db: Database) {
	log.step('Fetching complex terms spreadsheet...')
	const hints = await fetch_complex_terms()
	if (hints.length < 1) {
		throw new Error('Complex terms sheet returned no rows.')
	}

	log.step(`Rebuilding Complex_Terms table with ${hints.length} terms...`)
	tabitha_db.run('DROP TABLE IF EXISTS Complex_Terms')
	tabitha_db.run(CREATE_COMPLEX_TERMS_TABLE_SQL)

	const insert = tabitha_db.prepare(INSERT_COMPLEX_TERMS_SQL)
	tabitha_db.transaction(() => {
		for (const { stem, sense, part_of_speech, structure, pairing, explication, ontology_status, level, notes } of hints) {
			insert.run(stem, sense, part_of_speech, structure, pairing, explication, ontology_status, level, notes ?? '')
		}
	})()
}
