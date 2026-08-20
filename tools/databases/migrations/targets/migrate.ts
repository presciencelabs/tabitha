import Database from 'bun:sqlite'
import { migrate_form_names_table } from './migrate_form_names_table'
import { migrate_lexical_features_table } from './migrate_lexical_features_table'
import { migrate_source_features_table } from './migrate_source_features_table'
import { migrate_lexical_forms } from './migrate_lexical_forms'
import { migrate_lexicon_table } from './migrate_lexicon_table'
import { migrate_text_table } from './migrate_text_table'
import { migrate_ideal_text_table } from './migrate_ideal_text_table'
import { transform_inflections } from '../../data/inflections/transform'
import { basename, join } from 'path'

// usage: `bun targets/migrate.ts raw/English_YYYY-MM-DD.tbta.sqlite [raw/[Swahili|Indonesian|Tagalog]_YYYY-MM-DD.tbta.sqlite] raw/Targets_YYYY-MM-DD.tabitha.sqlite`
const args = Bun.argv.slice(2)
if (args.length < 2) {
	throw new Error('Usage: bun targets/migrate.ts <English_db_path> [Optional_Language_db_paths...] <Targets_db_path>')
}

const targets_db_name = args.pop()!
if (!basename(targets_db_name).includes('Targets')) {
	throw new Error('Targets database must be present.')
}

const tbta_db_names = args

const has_english = tbta_db_names.some(db_name => {
	const project = basename(db_name).split('_')[0]
	return project === 'English'
})

if (!has_english) {
	throw new Error('English database must be present.')
}

const targets_db = new Database(targets_db_name)

// drastic perf improvement: https://www.sqlite.org/pragma.html#pragma_journal_mode
targets_db.run('PRAGMA journal_mode = WAL')

await transform_inflections(join(import.meta.dir, '../../data/inflections'))

for (const tbta_db_name of tbta_db_names) {
	const project = basename(tbta_db_name).split('_')[0]

	const tbta_db = new Database(tbta_db_name, { readwrite: true, create: false })

	migrate_text_table(tbta_db, project, targets_db)
	migrate_lexicon_table(tbta_db, project, targets_db)

	// Lexical forms are only implemented for English (for now).
	if (project === 'English') {
		await migrate_lexical_forms(project, targets_db, join(import.meta.dir, '../../data/inflections/csv'))
	}

	migrate_form_names_table(tbta_db, project, targets_db)
	migrate_source_features_table(tbta_db, project, targets_db)
	migrate_lexical_features_table(tbta_db, project, targets_db)

	await migrate_ideal_text_table(project, targets_db, join(import.meta.dir, '../../data/ideal_texts'))

	tbta_db.close()
}

console.log(`[Targets migration] Optimizing ${targets_db_name}...`)
targets_db.run('VACUUM')
console.log('[Targets migration] done.')

