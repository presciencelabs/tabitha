import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { plan_migration } from './plan'

let original_cwd: string
let temp_dir: string

beforeEach(() => {
	original_cwd = process.cwd()
	temp_dir = mkdtempSync(join(tmpdir(), 'tabitha-plan-test-'))
	mkdirSync(join(temp_dir, 'raw'))
	process.chdir(temp_dir)
})

afterEach(() => {
	process.chdir(original_cwd)
	rmSync(temp_dir, { recursive: true, force: true })
})

function touch(name: string) {
	writeFileSync(join(temp_dir, 'raw', name), 'fixture content')
}

function stage_ontology(date: string) {
	touch(`Ontology_9494_${date}.tabitha.sqlite`)
}

describe('plan_migration', () => {
	it('does a full build for every task on a first run (no prior outputs)', async () => {
		const date = '2026-08-29'
		touch(`Bible_${date}.tbta.sqlite`)
		touch(`English_${date}.tbta.sqlite`)
		touch(`Sources_Complex_${date}.tabitha.sqlite`)
		stage_ontology(date)

		const plan = await plan_migration(date)

		const sources = plan.tasks.find(t => t.id === 'Sources')!
		expect(sources.changed).toBe(true)
		expect(sources.previous_output_file).toBeUndefined()
		expect(sources.migrate_args).toEqual([`raw/Bible_${date}.tbta.sqlite`])
		expect(sources.output_file).toBe(`raw/Sources_${date}.tabitha.sqlite`)

		const targets = plan.tasks.find(t => t.id === 'Targets')!
		expect(targets.changed).toBe(true)
		expect(targets.migrate_args).toEqual([`raw/English_${date}.tbta.sqlite`])

		const ontology = plan.tasks.find(t => t.id === 'Ontology')!
		expect(ontology.changed).toBe(true)
		expect(ontology.migrate_args).toEqual([sources.output_file, `raw/Sources_Complex_${date}.tabitha.sqlite`])
	})

	it('skips a task entirely when none of its inputs changed', async () => {
		const prior_date = '2026-08-01'
		touch(`Bible_${prior_date}.tbta.sqlite`)
		touch(`Sources_${prior_date}.tabitha.sqlite`)

		const date = '2026-08-29'
		touch(`English_${date}.tbta.sqlite`) // Targets still needs to build; Sources has nothing new
		touch(`Sources_Complex_${date}.tabitha.sqlite`)
		stage_ontology(date)

		const plan = await plan_migration(date)

		const sources = plan.tasks.find(t => t.id === 'Sources')!
		expect(sources.changed).toBe(false)
		expect(sources.reason).toContain('no inputs changed')
		expect(sources.output_file).toBe(`raw/Sources_${prior_date}.tabitha.sqlite`)
		expect(sources.migrate_args).toEqual([])
	})

	it('copies forward and reprocesses only the changed inputs when some (not all) changed', async () => {
		const prior_date = '2026-08-01'
		touch(`Bible_${prior_date}.tbta.sqlite`)
		touch(`CommunityDevelopmentTexts_${prior_date}.tbta.sqlite`)
		touch(`Sources_${prior_date}.tabitha.sqlite`)

		const date = '2026-08-29'
		touch(`Bible_${date}.tbta.sqlite`) // only Bible changed this run
		touch(`English_${date}.tbta.sqlite`)
		touch(`Sources_Complex_${date}.tabitha.sqlite`)
		stage_ontology(date)

		const plan = await plan_migration(date)

		const sources = plan.tasks.find(t => t.id === 'Sources')!
		expect(sources.changed).toBe(true)
		expect(sources.previous_output_file).toBe(`raw/Sources_${prior_date}.tabitha.sqlite`)
		expect(sources.output_file).toBe(`raw/Sources_${date}.tabitha.sqlite`)
		// Only the changed input is passed -- CommunityDevelopmentTexts is left for copy-forward to preserve.
		expect(sources.migrate_args).toEqual([`raw/Bible_${date}.tbta.sqlite`])
	})

	it('throws when English is missing for Targets', async () => {
		const date = '2026-08-29'
		touch(`Bible_${date}.tbta.sqlite`)
		touch(`Sources_Complex_${date}.tabitha.sqlite`)
		stage_ontology(date)

		await expect(plan_migration(date)).rejects.toThrow(/English database not found/)
	})

	it('resolves Sources_Complex independently of Sources, even at a different date', async () => {
		const date = '2026-08-29'
		touch(`Bible_${date}.tbta.sqlite`)
		touch(`English_${date}.tbta.sqlite`)
		stage_ontology(date)
		// Sources_Complex wasn't regenerated this run (English/Bible/Sample all unchanged at staging) --
		// only an older one exists.
		touch('Sources_Complex_2026-08-01.tabitha.sqlite')

		const plan = await plan_migration(date)

		const ontology = plan.tasks.find(t => t.id === 'Ontology')!
		const sources = plan.tasks.find(t => t.id === 'Sources')!
		expect(ontology.migrate_args).toEqual([sources.output_file, 'raw/Sources_Complex_2026-08-01.tabitha.sqlite'])
	})

	it('throws when no staged Ontology database exists for the run date', async () => {
		const date = '2026-08-29'
		touch(`Bible_${date}.tbta.sqlite`)
		touch(`English_${date}.tbta.sqlite`)
		touch(`Sources_Complex_${date}.tabitha.sqlite`)

		await expect(plan_migration(date)).rejects.toThrow(/No staged Ontology database/)
	})
})
