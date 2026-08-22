import { $, Glob } from 'bun'
import Database from 'bun:sqlite'
import { cp, mkdir, rename } from 'fs/promises'
import { existsSync } from 'fs'
import { basename, join } from 'path'
import { create_logger } from './log'
import { load_state, mark_done, clear_state } from './state'
import { validate_migration_output, type ValidationConfig } from './validate'

const log = create_logger('Orchestrator')

const AUDIENCE_NAME = 'Unchurched Adults'
const USAGE = 'Usage: bun migrate.ts "<directory containing all necessary TBTA dbs>" YYYY-MM-DD'

if (!Bun.which('sqlite3')) {
	throw new Error('sqlite3 is not installed. Please install it and try again.')
}

const can_prompt = !!process.stdin.isTTY

const dir_w_tbta_dbs = Bun.argv[2] || (can_prompt ? prompt('Directory containing all necessary TBTA dbs:') : null) // "~/Downloads/TBTA 9-25-25"
if (!dir_w_tbta_dbs) {
	throw new Error(USAGE)
}

const today = new Date().toISOString().slice(0, 10)
const date = Bun.argv[3] || (can_prompt ? prompt('Date for this migration run (YYYY-MM-DD):', today) : null) || today // 2025-09-25
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
	throw new Error(`Invalid date "${date}". Expected format YYYY-MM-DD.`)
}

if (!process.env.LOG_LEVEL && can_prompt) {
	const verbose = confirm('Show verbose output (per-item detail and sample data dumps)?')
	process.env.LOG_LEVEL = verbose ? 'verbose' : 'normal'
}

let completed_steps = await load_state(date)
if (completed_steps.size > 0) {
	log.step(`Found an incomplete run for ${date} (${completed_steps.size} step(s) already done).`)
	const resume = can_prompt ? confirm('Resume from where it left off? (No = start this date over)') : true
	if (!resume) {
		await clear_state(date)
		completed_steps = new Set()
	}
}

if (completed_steps.has('staging')) {
	log.step('Skipping staging (already completed for this run).')
} else {
	await stage_tbta_files(dir_w_tbta_dbs)
	await mark_done(date, 'staging', completed_steps)
}

if (!Array.from(new Glob(`raw/Ontology_*_${date}.tabitha.sqlite`).scanSync('.'))[0]) {
	throw new Error(`No staged Ontology database found for ${date}. An Ontology.sqlite (or .new) file must be present in "${dir_w_tbta_dbs}" for every migration run.`)
}

if (!Array.from(new Glob(`raw/Sources_Complex_${date}.tabitha.sqlite`).scanSync('.'))[0]) {
	throw new Error(`No staged Sources_Complex database found for ${date}. This is normally generated automatically via "tbta_utils export-generated-cci" during staging -- if it's still missing, check that English.sqlite and Bible.sqlite were present in "${dir_w_tbta_dbs}" and that the tbta_utils step above succeeded.`)
}

const migration_dbs = Array.from(new Glob(`raw/*_${date}.tbta.sqlite`).scanSync('.'))

type DbConfig = {
	key: 'Sources' | 'Ontology' | 'Targets'
	validation: ValidationConfig
	migration_input_args(): Promise<string[]>
	migration_output_file(): Promise<string>
	migration_dump_file(): Promise<string>
}
const configs: DbConfig[] = [
	{
		key: 'Sources',
		validation: {
			// The source Bible text is expected to be complete, so every canonical book must be present.
			book_check: { table: 'Sources', book_column: 'id_primary', where: "type = 'Bible'", require_complete: true },
			duplicate_check: { table: 'Sources', columns: ['type', 'id_primary', 'id_secondary', 'id_tertiary'] },
			row_count_table: 'Sources',
		},
		async migration_input_args() {
			const sources = ['Bible', 'CommunityDevelopmentTexts', 'GrammarIntroduction']

			const args = await Promise.all(
				sources.map(async name => {
					const match = migration_dbs.find(db => db.includes(name))
					if (match) return match

					const files = Array.from(new Glob(`raw/${name}_*.tbta.sqlite`).scanSync('.'))
					files.sort() // lexicographical sort will serve correctly for YYYY-MM-DD
					const latest = files.pop()

					if (latest) log.warn(`Source ${name} missing for ${date}, using: ${latest} instead.`)

					return latest || ''
				}),
			)

			return args.filter(Boolean)
		},
		async migration_output_file() {
			return `raw/${this.key}_${date}.tabitha.sqlite`
		},
		async migration_dump_file() {
			return `snapshots/${basename(await this.migration_output_file())}.sql`
		},
	},
	{
		key: 'Ontology',
		validation: {
			// Complex_Terms is the one table this migration step actually populates, so it's the
			// meaningful signal for row-count sanity here (the rest of Ontology.sqlite is the
			// untouched TBTA export).
			row_count_table: 'Complex_Terms',
		},
		async migration_input_args() {
			const sources = await configs.find(cfg => cfg.key === 'Sources')!.migration_output_file()

			return [sources]
		},
		async migration_output_file() {
			return Array.from(new Glob(`raw/Ontology_*_${date}.tabitha.sqlite`).scanSync('.'))[0]!
		},
		async migration_dump_file() {
			return `snapshots/${basename(await this.migration_output_file())}.sql`
		},
	},
	{
		key: 'Targets',
		validation: {
			// Per-language translation output is expected to only partially cover the canon while
			// in progress, so only unexpected/misspelled book names fail this check, not missing ones.
			book_check: { table: 'Text', book_column: 'book', require_complete: false },
			duplicate_check: { table: 'Text', columns: ['project', 'book', 'chapter', 'verse', 'audience'] },
			row_count_table: 'Text',
		},
		async migration_input_args() {
			const english = migration_dbs.find(db => db.includes('English'))
			if (!english) {
				throw new Error(`English database not found for ${this.key} migration.`)
			}

			const target_languages = ['Swahili', 'Indonesian', 'Tagalog']

			const language_args = await Promise.all(
				target_languages.map(async name => {
					const match = migration_dbs.find(db => db.includes(name))
					if (match) return match

					const files = Array.from(new Glob(`raw/${name}_*.tbta.sqlite`).scanSync('.'))
					files.sort() // lexicographical sort will serve correctly for YYYY-MM-DD
					const latest = files.pop()

					if (latest) log.warn(`Target language ${name} missing for ${date}, using: ${latest} instead.`)

					return latest || ''
				}),
			)

			return [english, ...language_args.filter(Boolean)]
		},
		async migration_output_file() {
			return `raw/${this.key}_${date}.tabitha.sqlite`
		},
		async migration_dump_file() {
			return `snapshots/${basename(await this.migration_output_file())}.sql`
		},
	},
]

for (const cfg of configs) {
	const migrated_step = `${cfg.key}:migrated` as const
	const dumped_step = `${cfg.key}:dumped` as const

	const output_file = await cfg.migration_output_file()
	const dump_file = await cfg.migration_dump_file()

	if (completed_steps.has(migrated_step)) {
		log.step(`Skipping ${cfg.key} migration (already completed for this run).`)
	} else {
		log.step(`Migrating ${cfg.key} database...`)
		const input_args = await cfg.migration_input_args()
		await $`bun migrations/${cfg.key.toLowerCase()}/migrate.ts ${input_args} ${output_file}`
		await mark_done(date, migrated_step, completed_steps)
	}

	if (completed_steps.has(dumped_step)) {
		log.step(`Skipping ${cfg.key} dump (already completed for this run).`)
	} else {
		log.step(`Creating dump of ${cfg.key} database...`)
		await $`sqlite3 --escape off ${output_file} .dump | grep -Ev "^PRAGMA|^BEGIN TRANSACTION|^COMMIT" > ${dump_file}`
		await mark_done(date, dumped_step, completed_steps)
	}

	// Always re-run validation, even on a resumed run -- this is the last gate before a D1 deploy,
	// so it must reflect the actual state of output_file every time, not just the first pass.
	await validate_migration_output(cfg.key, output_file, date, cfg.validation)

	// TEMPORARILY DISABLED for local verification
	// console.log(`[Orchestrator] Creating new D1 database for ${cfg.key}...`)
	// const d1_db_name = basename(output_file, '.tabitha.sqlite') // => Sources_2025-10-22 or Ontology_9493_2025-10-22
	// const cmd_output_new_db = await $`bun wrangler d1 create ${d1_db_name}`.text()

	// console.log(`[Orchestrator] Updating wrangler.jsonc with new ${cfg.key} database info...`)
	// const new_db_info = extract_new_db_info(cmd_output_new_db)
	// await update_deployment_config('./wrangler.jsonc', new_db_info, `DB_${cfg.key}`)

	// console.log(`[Orchestrator] Deploying new ${cfg.key} data to D1...`)
	// await $`bun wrangler d1 execute ${d1_db_name} --file ${dump_file} --remote`.quiet()
}

await clear_state(date)

log.summary()

async function stage_tbta_files(working_dir: string) {
	for await (const file of new Glob('*.new').scan(working_dir)) {
		await rename(`${working_dir}/${file}`, `${working_dir}/${file.replace('.new', '.sqlite')}`)
	}

	await run_tbta_utils(working_dir)

	const sqlite_files = Array.from(new Glob('*.sqlite').scanSync(working_dir))
	log.step(`Staging: ${sqlite_files.join(', ')}`)
	await Promise.all(stage(sqlite_files))

	await stage_win_files(working_dir)

	function stage(db_names: string[]): Promise<void>[] {
		return db_names
			.map(db_name => basename(db_name, '.sqlite')) // e.g., ~/Downloads/2025-09-25/Bible.sqlite => Bible
			.filter(Boolean) // remove empty strings
			.map(normalize_name)
			.map(async ({ src, dest }) => await cp(src, dest))
	}

	function normalize_name(name: string) {
		const src = `${working_dir}/${name}.sqlite`

		let dest = `./raw/${name}_${date}.tbta.sqlite`
		if (name === 'Ontology') {
			dest = derive_ontology_name()
		}
		if (name === 'Sources_Complex') {
			dest = `./raw/Sources_Complex_${date}.tabitha.sqlite`
		}

		return { src, dest }

		function derive_ontology_name() {
			const ontology = new Database(src, { readwrite: true, create: false })

			const row = ontology.query('SELECT version FROM Version').get() as { version: string } | null
			if (!row?.version) {
				throw new Error('Version table query returned no row or an empty version.')
			}

			const minor_version = row.version.split('.').at(-1) // 3.0.9493 => 9493
			if (!minor_version) {
				throw new Error(`Could not derive minor version from "${row.version}".`)
			}

			return `./raw/Ontology_${minor_version}_${date}.tabitha.sqlite`
		}
	}
}

async function stage_win_files(working_dir: string) {
	const win_dest_dir = join(import.meta.dir, '../data/inflections/win')
	await mkdir(win_dest_dir, { recursive: true })

	const win_files = Array.from(new Glob('*.win.txt').scanSync(working_dir))
	await Promise.all(win_files.map(async file => await cp(`${working_dir}/${file}`, `${win_dest_dir}/${file}`)))
}

// tbta_utils requires Sample.sqlite, Ontology.sqlite, and (for export-generated-cci) Bible.sqlite to be
// present under those exact plain names in its working directory -- which is why this runs against
// working_dir *before* those files get copied/renamed into raw/, since they're already sitting there
// under their original TBTA export names at this point.
async function run_tbta_utils(working_dir: string) {
	const tbta_utils = resolve_tbta_utils_binary()

	const has_english = await Bun.file(`${working_dir}/English.sqlite`).exists()
	if (!has_english) {
		log.warn('No English.sqlite found in the provided directory; skipping tbta_utils steps (Sources_Complex and inflections must already be staged, or this run will fail its upfront checks).')
		return
	}

	log.step('Running tbta_utils export-lexical-forms...')
	await $`${tbta_utils} export-lexical-forms --language English.sqlite --output-path ${working_dir}`.cwd(working_dir)

	log.step('Running tbta_utils export-generated-cci (this processes the full Bible and can take ~10 minutes)...')
	await $`${tbta_utils} export-generated-cci --language English.sqlite --audience-name ${AUDIENCE_NAME} --output-path ${working_dir}/Sources_Complex.sqlite`.cwd(working_dir)
}

function resolve_tbta_utils_binary(): string {
	const platform_dirs: Record<string, string> = {
		'darwin-arm64': 'darwin-arm64',
	}
	const key = `${process.platform}-${process.arch}`
	const platform_dir = platform_dirs[key]
	if (!platform_dir) {
		throw new Error(`No tbta_utils binary is vendored for platform "${key}". Currently available: ${Object.keys(platform_dirs).join(', ')} (see tools/databases/tbta_utils/).`)
	}

	const binary_path = join(import.meta.dir, '../tbta_utils', platform_dir, 'tbta_utils')
	if (!existsSync(binary_path)) {
		throw new Error(`tbta_utils binary not found at ${binary_path}.`)
	}

	return binary_path
}

