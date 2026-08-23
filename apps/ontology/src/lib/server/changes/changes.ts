import type { User } from '@auth/sveltekit'
import type { D1Database } from '@cloudflare/workers-types'
import { create_concept, get_concept_for_update, update_concept } from './concepts'
import { get_version } from '$lib/server/ontology'
import { default_categories } from '$lib/lookups'
import type {
	OntologyChange,
	OntologyChangeAction,
	OntologyChangeDataFields,
	PartOfSpeech,
} from '$lib/types'
import type {
	ConceptCreateData,
	ConceptUpdateData,
	DbOntologyChange,
} from '$lib/server/types'

async function create_table_if_not_exists(db: D1Database) {
	const sql = `
		CREATE TABLE IF NOT EXISTS Changes (
			'id'								INTEGER PRIMARY KEY,
			'concept_stem'					TEXT,
			'concept_sense'				TEXT,
			'concept_part_of_speech'	TEXT,
			'data'							TEXT,
			'action'							TEXT,
			'suggested_by_email'			TEXT,
			'suggested_date'				TEXT,
			'approved_by_email'			TEXT,
			'approved_date'				TEXT,
			'applied_date'					TEXT,
			'version'						TEXT
		)
	`
	// Ensure table exists
	await db.prepare(sql).run()
}

export async function get_all_changes(db: D1Database): Promise<OntologyChange[]> {
	await create_table_if_not_exists(db)

	const sql = `
		SELECT *
		FROM Changes
		ORDER BY applied_date DESC NULLS FIRST, approved_date DESC NULLS FIRST
	`
	const { results } = await db.prepare(sql).all<DbOntologyChange>()
	return results.map(transform)
}

export async function get_pending_changes(db: D1Database): Promise<OntologyChange[]> {
	await create_table_if_not_exists(db)

	const sql = `
		SELECT *
		FROM Changes
		WHERE applied_date IS NULL
		ORDER BY approved_date DESC NULLS FIRST
	`
	const { results } = await db.prepare(sql).all<DbOntologyChange>()
	return results.map(transform)
}

// Records the change and, since only authorized users can reach this, applies it immediately using the diff already in hand -- no re-fetch.
export async function add_change(db: D1Database, action: OntologyChangeAction, data: ConceptUpdateData, user: User): Promise<boolean> {
	await create_table_if_not_exists(db)

	const { stem, sense, part_of_speech } = data
	const change_data = action === 'create' ? create_change_data(data) : await diff_change_data(db, data)

	const sql = `
		INSERT INTO Changes (
			concept_stem,
			concept_sense,
			concept_part_of_speech,
			data,
			action,
			approved_by_email,
			approved_date
			)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`

	const approved_date = new Date().toISOString()
	const result = await db.prepare(sql)
		.bind(stem, sense, part_of_speech, JSON.stringify(change_data), action, user.email!, approved_date)
		.run()

	const change: OntologyChange = {
		id: result.meta.last_row_id,
		concept: { stem, sense, part_of_speech },
		data: change_data,
		action,
		approved_by: { email: user.email!, date: new Date(approved_date) },
		applied_date: null,
		version: null,
	}

	const version = await get_next_version(db)
	return apply_one_change(db, change, version, new Date().toISOString())
}

function create_change_data(create_data: ConceptCreateData): OntologyChangeDataFields {
	const { level, gloss, brief_gloss, categories } = create_data
	return {
		level: { value: level },
		gloss: { value: gloss },
		...brief_gloss ? { brief_gloss: { value: brief_gloss } } : {},
		categories: { value: categories },
	}
}

async function diff_change_data(db: D1Database, update_data: ConceptUpdateData): Promise<OntologyChangeDataFields> {
	// only record the fields that actually changed
	const old = (await get_concept_for_update(db, update_data))!

	const fields: (keyof OntologyChangeDataFields)[] = ['level', 'gloss', 'brief_gloss', 'categories', 'curated_examples']
	return Object.fromEntries(
		fields.flatMap(field => {
			return old[field]?.toString() !== update_data[field]?.toString()
				? [[field, { old: old[field], value: update_data[field] }]]
				: []
		}),
	)
}

function transform(db_change: DbOntologyChange): OntologyChange {
	const {
		id,
		concept_stem,
		concept_sense,
		concept_part_of_speech,
		data,
		action,
		approved_by_email,
		approved_date,
		applied_date,
		version,
	} = db_change

	return {
		id,
		concept: {
			stem: concept_stem,
			sense: concept_sense,
			part_of_speech: concept_part_of_speech,
		},
		data: JSON.parse(data) as OntologyChangeDataFields,
		action,
		approved_by: approved_by_email && approved_date ? { email: approved_by_email, date: new Date(approved_date) } : null,
		applied_date: applied_date ? new Date(applied_date) : null,
		version,
	}
}

export async function apply_pending_changes(db: D1Database): Promise<{ count: number, failed: number, version: string }> {
	await create_table_if_not_exists(db)

	const sql = `
		SELECT *
		FROM Changes
		WHERE approved_date IS NOT NULL AND applied_date IS NULL
	`
	const { results } = await db.prepare(sql).all<DbOntologyChange>()
	const pending_changes = results.map(transform)

	if (!pending_changes.length) {
		return {
			count: 0,
			failed: 0,
			version: await get_version(db),
		}
	}

	const version = await get_next_version(db)
	const applied_date = new Date().toISOString()

	let count = 0
	let failed = 0

	for (const change of pending_changes) {
		const applied = await apply_one_change(db, change, version, applied_date)
		if (applied) {
			count++
		} else {
			failed++
		}
	}
	// TODO once changes are fully supported, actually save the new version within the 'Version' table

	return {
		count,
		failed,
		version,
	}
}

// On failure, applying stays pending (applied_date left null) for the /protected/changes review flow to retry.
async function apply_one_change(db: D1Database, change: OntologyChange, version: string, applied_date: string): Promise<boolean> {
	try {
		if (change.action === 'create') {
			const fallback_categories = default_categories[change.concept.part_of_speech as PartOfSpeech] || []
			const create_data: ConceptCreateData = {
				...change.concept,
				level: change.data.level?.value ?? '0',
				gloss: change.data.gloss?.value ?? '',
				brief_gloss: change.data.brief_gloss?.value ?? '',
				categories: change.data.categories?.value ?? fallback_categories,
				curated_examples: change.data.curated_examples?.value ?? '',
			}
			await create_concept(db, create_data)
		} else {
			const current_data = (await get_concept_for_update(db, change.concept))!
			const update_data: ConceptUpdateData = {
				...change.concept,
				level: change.data.level?.value ?? current_data.level,
				gloss: change.data.gloss?.value ?? current_data.gloss,
				brief_gloss: change.data.brief_gloss?.value ?? current_data.brief_gloss,
				categories: change.data.categories?.value ?? current_data.categories,
				curated_examples: change.data.curated_examples?.value ?? current_data.curated_examples,
			}
			await update_concept(db, update_data)
		}

		const sql = `
			UPDATE Changes
			SET applied_date = ?, version = ?
			WHERE id = ?
		`
		await db.prepare(sql).bind(applied_date, version, change.id).run()
		return true
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err)
		console.error(`Failed to apply change ${change.id}: ${message}`)

		const sql = `
			UPDATE Changes
			SET version = ?
			WHERE id = ?
		`
		await db.prepare(sql).bind('Failed', change.id).run()
		return false
	}
}

async function get_next_version(db: D1Database): Promise<string> {
	// TODO once changes are fully supported, simply get the current version from the 'Version' table
	const sql = `
		SELECT version
		FROM Changes
		WHERE version IS NOT NULL
		ORDER BY applied_date DESC
	`
	const version_from_changes = await db.prepare(sql).first<string>('version')
	const current_version = version_from_changes || await get_version(db)

	// e.g. "3.0.9495" -> [3, 0, 9495]
	const parts = current_version.split('.').map(Number)

	if (parts[2] < 9999) {
		parts[2]++
	} else if (parts[1] < 9999) {
		parts[2] = 0
		parts[1]++
	} else {
		parts[2] = 0
		parts[1] = 0
		parts[0]++
	}

	return parts.join('.')
}