import type { DbFeature } from './source'

/**
 * Canonical registry of target-language projects, each backed by its own D1 database (one
 * `DB_Targets_<project>` binding per entry -- see apps/targets/wrangler.jsonc). This is the single
 * source of truth driving route validation, binding resolution, and the migration pipeline's
 * per-project task list; add a new project here first, then provision its database and binding.
 */
export const TARGET_PROJECTS = ['English', 'Swahili', 'Indonesian', 'Tagalog'] as const

export type TargetProject = typeof TARGET_PROJECTS[number]

export type TargetTextResult = {
	text: string
	audience: string
	ideal?: string
}

export type TargetApiFeature = DbFeature

export type TargetApiFeatureResult = {
	source: TargetApiFeature[]
	lexical: TargetApiFeature[]
}

export type FormName = {
	form_name: string
	category: string
	features: string
}

export type LexicalForm = {
	stem: string
	form: string
	form_name: string
	category: string
}
