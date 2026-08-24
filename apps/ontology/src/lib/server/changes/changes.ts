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

interface GetChangeOptions {
	readonly db: D1Database
	readonly id: number
}

export async function get_change({ db, id }: GetChangeOptions): Promise<OntologyChange | null> {
	await create_table_if_not_exists(db)

	const db_change = await db.prepare('SELECT * FROM Changes WHERE id = ?').bind(id).first<DbOntologyChange>()
	return db_change ? transform(db_change) : null
}

type ChangeSubmission = {
	readonly db: D1Database
	readonly action: OntologyChangeAction
	readonly data: ConceptUpdateData
	readonly user: User
}

async function prepare_change_data({ db, action, data }: Pick<ChangeSubmission, 'db' | 'action' | 'data'>) {
	await create_table_if_not_exists(db)
	const { stem, sense, part_of_speech } = data
	const change_data = action === 'create' ? create_change_data(data) : await diff_change_data({ db, update_data: data })
	return { stem, sense, part_of_speech, change_data }
}

// Records an edit as an unapproved, unapplied suggestion, for an authorized user to review later.
export async function suggest_change({ db, action, data, user }: ChangeSubmission): Promise<boolean> {
	const { stem, sense, part_of_speech, change_data } = await prepare_change_data({ db, action, data })

	const sql = `
		INSERT INTO Changes (
			concept_stem,
			concept_sense,
			concept_part_of_speech,
			data,
			action,
			suggested_by_email,
			suggested_date
			)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`
	await db.prepare(sql)
		.bind(stem, sense, part_of_speech, JSON.stringify(change_data), action, user.email!, new Date().toISOString())
		.run()
	return false
}

// Applies the change immediately using the diff already in hand -- no re-fetch -- for an
// authorized user.
export async function apply_change_directly({ db, action, data, user }: ChangeSubmission): Promise<boolean> {
	const { stem, sense, part_of_speech, change_data } = await prepare_change_data({ db, action, data })

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
		suggested_by: null,
		approved_by: { email: user.email!, date: new Date(approved_date) },
		applied_date: null,
		version: null,
	}

	const version = await get_next_version(db)
	const applied = await apply_one_change({ db, change, version, applied_date: new Date().toISOString() })
	return !!applied.applied_date
}

interface CanApproveChangeOptions {
	readonly change: OntologyChange
	readonly permissions: { can_add: boolean, can_update: boolean }
}

export function can_approve_change({ change, permissions }: CanApproveChangeOptions): boolean {
	if (!change.suggested_by || change.approved_by) {
		return false
	}
	return change.action === 'create' ? permissions.can_add : permissions.can_update
}

interface ApproveChangeOptions {
	readonly db: D1Database
	readonly id: number
	readonly user: User
}

// Approves a suggested change so the existing apply-pending machinery will pick it up.
export async function approve_change({ db, id, user }: ApproveChangeOptions): Promise<OntologyChange> {
	await create_table_if_not_exists(db)

	const sql = `
		UPDATE Changes
		SET approved_by_email = ?, approved_date = ?
		WHERE id = ? AND approved_date IS NULL
	`
	await db.prepare(sql).bind(user.email!, new Date().toISOString(), id).run()

	return (await get_change({ db, id }))!
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

interface DiffChangeDataOptions {
	readonly db: D1Database
	readonly update_data: ConceptUpdateData
}

async function diff_change_data({ db, update_data }: DiffChangeDataOptions): Promise<OntologyChangeDataFields> {
	// only record the fields that actually changed
	const old = (await get_concept_for_update({ db, concept_key: update_data }))!

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
		suggested_by_email,
		suggested_date,
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
		suggested_by: suggested_by_email && suggested_date ? { email: suggested_by_email, date: new Date(suggested_date) } : null,
		approved_by: approved_by_email && approved_date ? { email: approved_by_email, date: new Date(approved_date) } : null,
		applied_date: applied_date ? new Date(applied_date) : null,
		version,
	}
}

export async function apply_pending_changes(db: D1Database): Promise<{ count: number, failed: number, version: string, changes: OntologyChange[] }> {
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
			changes: [],
		}
	}

	const version = await get_next_version(db)
	const applied_date = new Date().toISOString()

	const changes: OntologyChange[] = []
	for (const change of pending_changes) {
		changes.push(await apply_one_change({ db, change, version, applied_date }))
	}
	// TODO once changes are fully supported, actually save the new version within the 'Version' table

	const count = changes.filter(change => change.applied_date).length

	return {
		count,
		failed: changes.length - count,
		version,
		changes,
	}
}

interface ApplyOneChangeOptions {
	readonly db: D1Database
	readonly change: OntologyChange
	readonly version: string
	readonly applied_date: string
}

// On failure, applying stays pending (applied_date left null) for the /protected/changes review flow to retry.
async function apply_one_change({ db, change, version, applied_date }: ApplyOneChangeOptions): Promise<OntologyChange> {
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
			await create_concept({ db, data: create_data })
		} else {
			const current_data = (await get_concept_for_update({ db, concept_key: change.concept }))!
			const update_data: ConceptUpdateData = {
				...change.concept,
				level: change.data.level?.value ?? current_data.level,
				gloss: change.data.gloss?.value ?? current_data.gloss,
				brief_gloss: change.data.brief_gloss?.value ?? current_data.brief_gloss,
				categories: change.data.categories?.value ?? current_data.categories,
				curated_examples: change.data.curated_examples?.value ?? current_data.curated_examples,
			}
			await update_concept({ db, data: update_data })
		}

		const sql = `
			UPDATE Changes
			SET applied_date = ?, version = ?
			WHERE id = ?
		`
		await db.prepare(sql).bind(applied_date, version, change.id).run()
		return { ...change, applied_date: new Date(applied_date), version }
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err)
		console.error(`Failed to apply change ${change.id}: ${message}`)

		const sql = `
			UPDATE Changes
			SET version = ?
			WHERE id = ?
		`
		await db.prepare(sql).bind('Failed', change.id).run()
		return { ...change, version: 'Failed' }
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