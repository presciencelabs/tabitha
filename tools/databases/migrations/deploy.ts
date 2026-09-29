import { $ } from 'bun'
import { basename, join } from 'path'
import type { PlannedTask, TaskFamily } from './plan'
import { apply_status_to_d1 } from './sources/update_status'
import { create_logger } from './log'

const log = create_logger('Deploy')

const APP_BY_FAMILY: Record<TaskFamily, string> = {
	Sources: 'sources',
	Ontology: 'ontology',
	Targets: 'targets',
}

type D1Database = {
	readonly uuid: string
	readonly name: string
}

type DeployOptions = {
	readonly task: PlannedTask
	readonly dump_file: string
	readonly date: string
}

/**
 * Creates a brand-new, date-stamped D1 database for a migrated task, loads its dump, and repoints
 * the owning app's wrangler.jsonc binding at it. Production keeps reading the old database until
 * that wrangler.jsonc change is merged and deployed, so a run from a branch never touches it.
 */
export async function deploy_to_d1({ task, dump_file, date }: DeployOptions): Promise<void> {
	const database_name = basename(task.output_file, '.tabitha.sqlite') // => Sources_2025-10-22 or Ontology_9493_2025-10-22

	if (await find_d1_database(database_name)) {
		throw new Error(`D1 database "${database_name}" already exists but this run never finished loading it. Inspect it, then delete it (bun wrangler d1 delete ${database_name}) and re-run to deploy fresh.`)
	}

	log.step(`Creating D1 database ${database_name}...`)
	await $`bun wrangler d1 create ${database_name}`.quiet()

	const database = await find_d1_database(database_name)
	if (!database) {
		throw new Error(`D1 database "${database_name}" was not listed after creating it.`)
	}

	log.step(`Loading ${dump_file} into ${database_name}...`)
	await $`bun wrangler d1 execute ${database_name} --file ${dump_file} --remote --yes`.quiet()

	// A freshly-deployed Sources db doesn't carry status data (Sources migration only applies status
	// to the local build if a status CSV happened to be available at that time) -- reapply the latest
	// known status immediately so a new deploy never regresses to stale/no status.
	if (task.family === 'Sources') {
		await apply_status_to_d1(database_name, join(import.meta.dir, '../data/status'), date)
	}

	const config_path = join(import.meta.dir, '../../../apps', APP_BY_FAMILY[task.family], 'wrangler.jsonc')
	const binding = `DB_${task.id}`
	log.step(`Repointing ${binding} in ${config_path} at ${database_name}...`)
	const config_text = await Bun.file(config_path).text()
	await Bun.write(config_path, repoint_d1_binding({ config_text, binding, database }))
}

async function find_d1_database(name: string): Promise<D1Database | undefined> {
	const databases = await $`bun wrangler d1 list --json`.quiet().json() as D1Database[]
	return databases.find(database => database.name === name)
}

type RepointOptions = {
	readonly config_text: string
	readonly binding: string
	readonly database: D1Database
}

/**
 * Points every d1_databases entry for `binding` (top-level and each env, e.g. preview) at a new
 * database. Rewrites the raw text rather than parsing, so wrangler.jsonc's comments survive.
 */
export function repoint_d1_binding({ config_text, binding, database }: RepointOptions): string {
	const binding_entry = new RegExp(`("binding":\\s*"${binding}",\\s*"database_name":\\s*)"[^"]*"(,\\s*"database_id":\\s*)"[^"]*"`, 'g')

	if (!config_text.match(binding_entry)) {
		throw new Error(`No d1_databases entry with binding "${binding}" (followed by database_name, database_id) found in wrangler config.`)
	}

	return config_text.replace(binding_entry, (_match, name_prefix: string, id_prefix: string) => `${name_prefix}"${database.name}"${id_prefix}"${database.uuid}"`)
}
