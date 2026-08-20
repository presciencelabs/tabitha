import { $, Glob } from 'bun'
import Database from 'bun:sqlite'
import { cp, rename } from 'fs/promises'
import { basename } from 'path'
import { parse, stringify } from 'comment-json'

if (!Bun.which('sqlite3')) {
	throw new Error('sqlite3 is not installed. Please install it and try again.')
}

if (Bun.argv.length !== 4) {
	throw new Error('Usage: bun migrate.ts "<directory containing all necessary TBTA dbs>" YYYY-MM-DD')
}
const dir_w_tbta_dbs = Bun.argv[2] // "~/Downloads/TBTA 9-25-25"
const date = Bun.argv[3] // 2025-09-25

await stage_tbta_files(dir_w_tbta_dbs)

if (!Array.from(new Glob(`raw/Ontology_*_${date}.tabitha.sqlite`).scanSync('.'))[0]) {
	throw new Error(`No staged Ontology database found for ${date}. An Ontology.sqlite (or .new) file must be present in "${dir_w_tbta_dbs}" for every migration run.`)
}

const migration_dbs = Array.from(new Glob(`raw/*_${date}.tbta.sqlite`).scanSync('.'))

type DbConfig = {
	key: 'Sources' | 'Ontology' | 'Targets'
	migration_input_args(): Promise<string[]>
	migration_output_file(): Promise<string>
	migration_dump_file(): Promise<string>
}
const configs: DbConfig[] = [
	{
		key: 'Sources',
		async migration_input_args() {
			const sources = ['Bible', 'CommunityDevelopmentTexts', 'GrammarIntroduction']

			const args = await Promise.all(
				sources.map(async name => {
					const match = migration_dbs.find(db => db.includes(name))
					if (match) return match

					const files = Array.from(new Glob(`raw/${name}_*.tbta.sqlite`).scanSync('.'))
					files.sort() // lexicographical sort will serve correctly for YYYY-MM-DD
					const latest = files.pop()

					if (latest) console.warn(`[Orchestrator] Source ${name} missing for ${date}, using: ${latest} instead.`)

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
		async migration_input_args() {
			const projects = migration_dbs.filter(db =>
				['English', 'Swahili', 'Indonesian', 'Tagalog'].some(name => db.includes(name)),
			)

			if (!projects.some(db => db.includes('English'))) {
				throw new Error(`English database not found for ${this.key} migration.`)
			}

			return projects
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
	console.log(`[Orchestrator] Migrating ${cfg.key} database...`)

	const input_args = await cfg.migration_input_args()
	const output_file = await cfg.migration_output_file()
	const dump_file = await cfg.migration_dump_file()

	await $`bun migrations/${cfg.key.toLowerCase()}/migrate.ts ${input_args} ${output_file}`

	console.log(`[Orchestrator] Creating dump of ${cfg.key} database...`)
	await $`sqlite3 --escape off ${output_file} .dump | grep -Ev "^PRAGMA|^BEGIN TRANSACTION|^COMMIT" > ${dump_file}`

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

async function stage_tbta_files(working_dir: string) {
	for await (const file of new Glob('*.new').scan(working_dir)) {
		await rename(`${working_dir}/${file}`, `${working_dir}/${file.replace('.new', '.sqlite')}`)
	}

	const sqlite_files = Array.from(new Glob('*.sqlite').scanSync(working_dir))
	console.log('[Orchestrator] attempting to stage the following:', sqlite_files)
	await Promise.all(stage(sqlite_files))

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

type D1_META = {
	binding: string
	database_name: string
	database_id: string
}
function extract_new_db_info(output: string): D1_META {
	// example output:
	//
	// ⛅️ wrangler 4.42.0
	// ───────────────────
	// ✅ Successfully created DB 'Sources_2025-10-05' in region ENAM
	// Created your new D1 database.
	//
	// To access your new D1 Database in your Worker, add the following snippet to your configuration file:
	// {
	// 	"d1_databases": [
	// 		{
	// 			"binding": "Sources_2025_10_05",
	// 			"database_name": "Sources_2025-10-05",
	// 			"database_id": "90ccd9c5-37ee-4b83-9fca-3811ce0ca010"
	// 		}
	// 	]
	// }
	// ? Would you like Wrangler to add it on your behalf ?
	// 🤖 Using fallback value in non - interactive context: no
	const JSON_OBJECT = /^{.*^}/ms

	const match = output.match(JSON_OBJECT)
	if (!match) throw new Error('Could not find D1 database JSON in wrangler output')

	return JSON.parse(match[0]).d1_databases[0]
}

async function update_deployment_config(config_path: string, new_db_info: D1_META, binding: string) {
	const raw_cfg = await Bun.file(config_path).text()
	const wrangler_cfg = parse(raw_cfg) as unknown as { d1_databases: D1_META[] }

	const index = wrangler_cfg.d1_databases.findIndex((db: D1_META) => db.binding === binding)
	if (index !== -1) {
		wrangler_cfg.d1_databases[index].database_name = new_db_info.database_name
		wrangler_cfg.d1_databases[index].database_id = new_db_info.database_id

		return Bun.write(config_path, stringify(wrangler_cfg, null, 3))
	}
}
