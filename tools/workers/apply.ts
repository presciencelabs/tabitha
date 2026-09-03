import { join } from 'node:path'
import {
	build_command,
	desired_apps,
	managed_environment_variables,
	non_production_deploy_command,
	production_deploy_command,
	type DesiredApp,
} from './config'

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4'
const REPO_ROOT = join(import.meta.dir, '..', '..')

/** Workspace packages whose changes don't affect an app's built output, so they're left out of
 * the production trigger's watch paths even though the app genuinely depends on them. */
const build_irrelevant_packages = new Set(['@tabitha/eslint-config', '@tabitha/tsconfig'])

export type CloudflareCredentials = {
	account_id: string
	api_token: string
}

type TriggerRole = 'production' | 'non_production'

/** Cloudflare's Workers Builds trigger shape, trimmed to the fields this tool reads or writes.
 * Every Worker has exactly two of these -- one for its production branch, one named "Deploy
 * non-production branches" that fires for every other branch/PR -- and Cloudflare's dashboard
 * settings page only ever writes `build_command` and Build Variables to the production one,
 * silently leaving the non-production trigger's copies stale. That's the whole reason this tool
 * exists: see the "Workers Builds Git Integration" section of the `cloudflare-workers` skill. */
type CloudflareTrigger = {
	trigger_uuid: string
	build_command: string
	deploy_command: string
	branch_includes: string[]
	path_includes: string[]
	build_caching_enabled: boolean
}

type DesiredTriggerFields = {
	build_command: string
	deploy_command: string
	build_caching_enabled: boolean
	/** Left unset for the non-production trigger -- see the comment at its call site below. */
	path_includes?: string[]
}

export type FieldChange = { field: string; from: unknown; to: unknown }

export type TriggerPlan = {
	role: TriggerRole
	trigger_uuid: string
	field_changes: FieldChange[]
	env_var_changes: FieldChange[]
}

export type AppPlan = {
	worker_name: string
	production: TriggerPlan
	non_production: TriggerPlan
}

/** Computes (and, if `apply` is true, performs) the changes needed to bring every app's two
 * Workers Builds triggers in line with `config.ts`. Never touches `branch_includes`,
 * `path_excludes`, `root_directory`, or any environment variable this tool doesn't itself declare
 * in `managed_environment_variables` -- anything else already set on a trigger, by hand or by
 * something else, is left alone. */
export async function reconcile_workers(
	credentials: CloudflareCredentials,
	{ apply, apps = desired_apps }: { apply: boolean; apps?: DesiredApp[] },
	fetch_impl: typeof fetch = fetch,
): Promise<AppPlan[]> {
	const plans: AppPlan[] = []

	for (const app of apps) {
		const triggers = await get_triggers(credentials, app.worker_tag, fetch_impl)
		const production = triggers.find(t => t.branch_includes.includes('main'))
		const non_production = triggers.find(t => t !== production)
		if (!production || !non_production) {
			throw new Error(`Expected exactly one production and one non-production trigger for "${app.worker_name}", found ${triggers.length} trigger(s).`)
		}

		const watch_paths = await derive_watch_paths(app.app_dir)

		const production_plan = await reconcile_trigger(
			credentials,
			'production',
			production,
			{ build_command, deploy_command: production_deploy_command, build_caching_enabled: true, path_includes: watch_paths },
			apply,
			fetch_impl,
		)

		const non_production_plan = await reconcile_trigger(
			credentials,
			'non_production',
			non_production,
			// path_includes is left unset here deliberately: Cloudflare's own default is "*", so
			// every non-main branch push already gets a preview build regardless of which app
			// changed. Scoping it down to match production's watch paths would be a genuine
			// behavior change (fewer preview builds), not a drift fix -- worth doing later, but
			// as its own reviewed decision.
			{ build_command, deploy_command: non_production_deploy_command, build_caching_enabled: true },
			apply,
			fetch_impl,
		)

		plans.push({ worker_name: app.worker_name, production: production_plan, non_production: non_production_plan })
	}

	return plans
}

async function reconcile_trigger(
	credentials: CloudflareCredentials,
	role: TriggerRole,
	current: CloudflareTrigger,
	desired: DesiredTriggerFields,
	apply: boolean,
	fetch_impl: typeof fetch,
): Promise<TriggerPlan> {
	const field_changes: FieldChange[] = []

	if (current.build_command !== desired.build_command) field_changes.push({ field: 'build_command', from: current.build_command, to: desired.build_command })
	// Cloudflare's dashboard has been observed leaving stray leading/trailing whitespace on this
	// field from manual edits -- trim before comparing so that alone doesn't register as drift.
	if (current.deploy_command.trim() !== desired.deploy_command) field_changes.push({ field: 'deploy_command', from: current.deploy_command, to: desired.deploy_command })
	if (current.build_caching_enabled !== desired.build_caching_enabled) {
		field_changes.push({ field: 'build_caching_enabled', from: current.build_caching_enabled, to: desired.build_caching_enabled })
	}
	if (desired.path_includes && !same_string_set(current.path_includes, desired.path_includes)) {
		field_changes.push({ field: 'path_includes', from: current.path_includes, to: desired.path_includes })
	}

	if (apply && field_changes.length > 0) {
		await patch_trigger(
			credentials,
			current.trigger_uuid,
			{
				build_command: desired.build_command,
				deploy_command: desired.deploy_command,
				build_caching_enabled: desired.build_caching_enabled,
				...desired.path_includes ? { path_includes: desired.path_includes } : {},
			},
			fetch_impl,
		)
	}

	const env_var_changes = await reconcile_environment_variables(credentials, current.trigger_uuid, apply, fetch_impl)

	return { role, trigger_uuid: current.trigger_uuid, field_changes, env_var_changes }
}

async function reconcile_environment_variables(
	credentials: CloudflareCredentials,
	trigger_uuid: string,
	apply: boolean,
	fetch_impl: typeof fetch,
): Promise<FieldChange[]> {
	const current = await get_environment_variables(credentials, trigger_uuid, fetch_impl)
	const changes: FieldChange[] = []
	const to_set: Record<string, { value: string; is_secret: boolean }> = {}

	for (const [key, desired_value] of Object.entries(managed_environment_variables)) {
		const current_value = current[key]?.value
		if (current_value !== desired_value) {
			changes.push({ field: key, from: current_value ?? '(unset)', to: desired_value })
			to_set[key] = { value: desired_value, is_secret: false }
		}
	}

	if (apply && Object.keys(to_set).length > 0) {
		await patch_environment_variables(credentials, trigger_uuid, to_set, fetch_impl)
	}

	return changes
}

/** Derives the production trigger's watch paths from the app's own `package.json`, rather than
 * hand-maintaining a list per app: every declared workspace dependency (excluding
 * `build_irrelevant_packages`) becomes a `packages/<name>/*` entry, so a newly added dependency
 * is picked up automatically on the next `apply` run instead of silently going unwatched. */
async function derive_watch_paths(app_dir: string): Promise<string[]> {
	const pkg = (await Bun.file(join(REPO_ROOT, 'apps', app_dir, 'package.json')).json()) as {
		dependencies?: Record<string, string>
		devDependencies?: Record<string, string>
	}
	const all_deps = { ...pkg.dependencies, ...pkg.devDependencies }
	const workspace_packages = Object.entries(all_deps)
		.filter(([name, version]) => version.startsWith('workspace:') && !build_irrelevant_packages.has(name))
		.map(([name]) => name.replace('@tabitha/', ''))
		.sort()

	return [`apps/${app_dir}/*`, ...workspace_packages.map(pkg_dir => `packages/${pkg_dir}/*`), 'package.json', 'bun.lock']
}

function same_string_set(a: string[], b: string[]): boolean {
	if (a.length !== b.length) return false
	const sorted_a = [...a].sort()
	const sorted_b = [...b].sort()
	return sorted_a.every((value, index) => value === sorted_b[index])
}

async function get_triggers(credentials: CloudflareCredentials, worker_tag: string, fetch_impl: typeof fetch): Promise<CloudflareTrigger[]> {
	const response = await fetch_impl(`${CLOUDFLARE_API_BASE}/accounts/${credentials.account_id}/builds/workers/${worker_tag}/triggers`, {
		headers: auth_headers(credentials.api_token),
	})
	if (!response.ok) throw new Error(`Failed to fetch triggers for worker tag "${worker_tag}": ${response.status} ${await response.text()}`)
	const body = (await response.json()) as { result: CloudflareTrigger[] }
	return body.result
}

async function patch_trigger(credentials: CloudflareCredentials, trigger_uuid: string, fields: Record<string, unknown>, fetch_impl: typeof fetch): Promise<void> {
	const response = await fetch_impl(`${CLOUDFLARE_API_BASE}/accounts/${credentials.account_id}/builds/triggers/${trigger_uuid}`, {
		method: 'PATCH',
		headers: auth_headers(credentials.api_token),
		body: JSON.stringify(fields),
	})
	if (!response.ok) throw new Error(`Failed to update trigger "${trigger_uuid}": ${response.status} ${await response.text()}`)
}

async function get_environment_variables(
	credentials: CloudflareCredentials,
	trigger_uuid: string,
	fetch_impl: typeof fetch,
): Promise<Record<string, { value: string; is_secret: boolean }>> {
	const response = await fetch_impl(`${CLOUDFLARE_API_BASE}/accounts/${credentials.account_id}/builds/triggers/${trigger_uuid}/environment_variables`, {
		headers: auth_headers(credentials.api_token),
	})
	if (!response.ok) throw new Error(`Failed to fetch environment variables for trigger "${trigger_uuid}": ${response.status} ${await response.text()}`)
	const body = (await response.json()) as { result: Record<string, { value: string; is_secret: boolean }> }
	return body.result
}

async function patch_environment_variables(
	credentials: CloudflareCredentials,
	trigger_uuid: string,
	vars: Record<string, { value: string; is_secret: boolean }>,
	fetch_impl: typeof fetch,
): Promise<void> {
	const response = await fetch_impl(`${CLOUDFLARE_API_BASE}/accounts/${credentials.account_id}/builds/triggers/${trigger_uuid}/environment_variables`, {
		method: 'PATCH',
		headers: auth_headers(credentials.api_token),
		body: JSON.stringify(vars),
	})
	if (!response.ok) throw new Error(`Failed to update environment variables for trigger "${trigger_uuid}": ${response.status} ${await response.text()}`)
}

function auth_headers(api_token: string): HeadersInit {
	return {
		'Authorization': `Bearer ${api_token}`,
		'Content-Type': 'application/json',
	}
}

if (import.meta.main) {
	const account_id = require_env('CLOUDFLARE_ACCOUNT_ID')
	const api_token = require_env('CLOUDFLARE_API_TOKEN')
	const apply = process.argv.includes('--run')

	const plans = await reconcile_workers({ account_id, api_token }, { apply })

	let any_changes = false
	for (const plan of plans) {
		for (const trigger_plan of [plan.production, plan.non_production]) {
			const all_changes = [...trigger_plan.field_changes, ...trigger_plan.env_var_changes]
			if (all_changes.length === 0) {
				console.log(`${plan.worker_name} (${trigger_plan.role}): unchanged`)
				continue
			}
			any_changes = true
			const verb = apply ? 'updated' : 'would update'
			console.log(`${plan.worker_name} (${trigger_plan.role}): ${verb} ${all_changes.map(c => c.field).join(', ')}`)
			for (const change of all_changes) {
				console.log(`  ${change.field}: ${JSON.stringify(change.from)} -> ${JSON.stringify(change.to)}`)
			}
		}
	}

	if (!apply && any_changes) console.log('\nRun with --run to apply these changes.')
}

function require_env(key: string): string {
	const value = process.env[key]
	if (!value) throw new Error(`Missing required env var "${key}". Set it in tools/workers/.env.local.`)
	return value
}
