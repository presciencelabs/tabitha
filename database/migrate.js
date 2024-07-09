import {Database} from 'bun:sqlite'
import {migrate_text_table} from './migrate_text_table'
import {migrate_lexicon_table} from './migrate_lexicon_table'
import {migrate_lexical_forms} from './migrate_lexical_forms'
import {migrate_form_names_table} from './migrate_form_names_table'
import {migrate_lexical_features_table} from './migrate_lexical_features_table'

// usage: `bun migrate.js English.YYYY-MM-DD.mdb.sqlite Targets.YYYY-MM-DD.tabitha.sqlite`
const tbta_db_name 		= Bun.argv[2] 						// English.YYYY-MM-DD.mdb.sqlite
const project				= tbta_db_name.split('.')[0] 	// English
const targets_db_name	= Bun.argv[3] 						// Targets.YYYY-MM-DD.tabitha.sqlite

const tbta_db		= new Database(tbta_db_name)
const targets_db 	= new Database(targets_db_name)

// drastic perf improvement: https://www.sqlite.org/pragma.html#pragma_journal_mode
targets_db.exec('PRAGMA journal_mode = WAL')

migrate_text_table(tbta_db, project, targets_db)
migrate_lexicon_table(tbta_db, project, targets_db)
await migrate_lexical_forms(project, targets_db)
migrate_form_names_table(tbta_db, project, targets_db)
migrate_lexical_features_table(tbta_db, project, targets_db)

console.log(`Optimizing ${targets_db_name}...`)
targets_db.query(`VACUUM`).run()
console.log('done.')
