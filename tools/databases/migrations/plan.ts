import { Glob } from 'bun'
import { resolve_dated_file } from './resolve_dated_file'

export type TaskId = 'Sources' | 'Ontology' | 'Targets'

export type PlannedTask = {
	id: TaskId
	// Whether this task will do real work this run -- false means every one of its inputs was
	// determined unchanged at staging time, so the prior output is left in place untouched.
	changed: boolean
	reason: string
	// Only the inputs that actually need reprocessing (for a dedup-eligible task with a prior
	// output to copy forward from), or every resolved input otherwise.
	migrate_args: string[]
	output_file: string
	previous_output_file?: string
}

export type MigrationPlan = {
	date: string
	tasks: PlannedTask[]
}

const SOURCES_INPUTS = ['Bible', 'CommunityDevelopmentTexts', 'GrammarIntroduction']
const TARGET_INPUTS = ['English', 'Swahili', 'Indonesian', 'Tagalog']

/**
 * Walks the migration pipeline's dependency graph for a given run date, resolving every task's
 * actual inputs (fresh vs. carried-forward latest) and deciding whether each needs to run at all,
 * without executing anything. This is the one place "which file to use" is decided -- staging's
 * content-hash dedup already determined per-input freshness (encoded in each resolved file's own
 * date), so planning only needs to read that back, not recompute it.
 */
export async function plan_migration(date: string): Promise<MigrationPlan> {
	const sources_task = await plan_rebuild_task('Sources', SOURCES_INPUTS, date, { hard_required: [] })
	const ontology_task = await plan_ontology_task(date, sources_task)
	const targets_task = await plan_rebuild_task('Targets', TARGET_INPUTS, date, { hard_required: ['English'] })

	return { date, tasks: [sources_task, ontology_task, targets_task] }
}

async function plan_rebuild_task(id: 'Sources' | 'Targets', input_names: string[], date: string, { hard_required }: { hard_required: string[] }): Promise<PlannedTask> {
	const resolved = await Promise.all(input_names.map(async name => ({ name, path: await resolve_dated_file('raw', name, date, 'tbta.sqlite') })))

	for (const name of hard_required) {
		if (!resolved.find(r => r.name === name)?.path) {
			throw new Error(`${name} database not found for ${id} migration.`)
		}
	}

	const present = resolved.filter((r): r is { name: string, path: string } => Boolean(r.path))
	const all_inputs = present.map(r => r.path)
	const changed_inputs = present.filter(r => extract_date(r.path) === date).map(r => r.path)

	const previous_output_file = await latest_previous_output_file(id, date)
	const changed = changed_inputs.length > 0 || !previous_output_file

	const output_file = changed ? `raw/${id}_${date}.tabitha.sqlite` : previous_output_file!

	return {
		id,
		changed,
		reason: !changed
			? `no inputs changed since ${previous_output_file}`
			: previous_output_file
				? `${changed_inputs.length}/${all_inputs.length} input(s) changed`
				: 'no prior output exists -- full build',
		migrate_args: !changed ? [] : previous_output_file ? changed_inputs : all_inputs,
		output_file,
		previous_output_file,
	}
}

async function plan_ontology_task(date: string, sources_task: PlannedTask): Promise<PlannedTask> {
	const output_file = Array.from(new Glob(`raw/Ontology_*_${date}.tabitha.sqlite`).scanSync('.'))[0]
	if (!output_file) {
		throw new Error(`No staged Ontology database found for ${date}. An Ontology.sqlite (or .new) file must be present for every migration run.`)
	}

	// Sources_Complex is generated during staging (via tbta_utils) and may itself have been left
	// unchanged there -- resolve whichever one actually exists, which may be an older date than
	// today's Ontology/Sources files.
	const sources_complex_file = await resolve_dated_file('raw', 'Sources_Complex', date, 'tabitha.sqlite')
	if (!sources_complex_file) {
		throw new Error(`No Sources_Complex database found for ${date} (or any prior date). This is normally generated automatically via "tbta_utils export-generated-cci" during staging.`)
	}

	return {
		id: 'Ontology',
		changed: true,
		reason: 'Ontology is exempt from staging dedup and always regenerated fresh.',
		migrate_args: [sources_task.output_file, sources_complex_file],
		output_file,
	}
}

// A raw input's resolved path carries the date it was actually staged under (see staging's
// content-hash dedup) -- if that date isn't today's run date, staging determined it was unchanged
// and skipped restaging it, so it doesn't need reprocessing this run.
function extract_date(path: string): string | undefined {
	return path.match(/_(\d{4}-\d{2}-\d{2})\.(?:tbta|tabitha)\.sqlite$/)?.[1]
}

// The prior run's output to copy forward from -- explicitly excludes today's date, since a
// resumed run may already have a partially-written today's file on disk that must not be
// mistaken for "the previous run's" output.
async function latest_previous_output_file(id: string, date: string): Promise<string | undefined> {
	const files = Array.from(new Glob(`raw/${id}_*.tabitha.sqlite`).scanSync('.')).filter(file => !file.includes(`_${date}.`))
	files.sort() // lexicographical sort will serve correctly for YYYY-MM-DD
	return files.pop()
}
