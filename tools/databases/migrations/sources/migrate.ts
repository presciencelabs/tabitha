import Database from 'bun:sqlite'
import { migrate_source_features } from './migrate_source_features'
import { migrate_source_texts } from './migrate_source_texts'
import { basename, join } from 'path'
import { migrate_source_status } from './migrate_source_status'

// usage: `bun sources/migrate.ts raw/Bible_YYYY-MM-DD.tbta.sqlite [raw/CommunityDevelopmentTexts_YYYY-MM-DD.tbta.sqlite] [raw/GrammarIntroduction_YYYY-MM-DD.tbta.sqlite] raw/Sources_YYYY-MM-DD.tabitha.sqlite`
const args = Bun.argv.slice(2)
if (args.length < 2) {
	throw new Error('Usage: bun sources/migrate.ts <Bible_db_path> [Optional_source_db_paths...] <Sources_db_path>')
}

const tabitha_db_name = args.pop()!
if (!basename(tabitha_db_name).includes('Sources')) {
	throw new Error('Sources database must be present.')
}

const tbta_sources_from_input = args // individual database names representing all of the sources

const date = basename(tabitha_db_name).match(/(\d{4}-\d{2}-\d{2})\.tabitha\.sqlite$/)?.[1]
if (!date) {
	throw new Error(`Could not extract a YYYY-MM-DD date from "${tabitha_db_name}".`)
}

const tabitha_sources_db = new Database(tabitha_db_name)

// drastic perf improvement: https://www.sqlite.org/pragma.html#pragma_journal_mode
tabitha_sources_db.run('PRAGMA journal_mode = WAL')

migrate_source_texts(tabitha_sources_db, tbta_sources_from_input)

const tbta_sample_db = new Database(`raw/Sample_${date}.tbta.sqlite`, { readwrite: true, create: false })
migrate_source_features(tbta_sample_db, tabitha_sources_db)

await migrate_source_status(tabitha_sources_db, join(import.meta.dir, '../../data/status'), date)

console.log(`[Sources migration] Optimizing ${tabitha_db_name}...`)
tabitha_sources_db.run('VACUUM')
console.log('[Sources migration] done.')
