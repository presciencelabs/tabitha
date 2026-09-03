import { describe, expect, it, mock } from 'bun:test'
import { reconcile_workers } from './apply'
import { build_command, non_production_deploy_command, production_deploy_command } from './config'

const credentials = { account_id: 'account-1', api_token: 'token-1' }

// Reuses apps/www as the fixture app -- derive_watch_paths reads a real package.json off disk,
// and www's dependency list is the smallest of the 6 real apps.
const test_app = { worker_name: 'www', app_dir: 'www', worker_tag: 'tag-www' }
const www_watch_paths = ['apps/www/*', 'packages/api-client/*', 'packages/types/*', 'packages/ui/*', 'packages/vite-config/*', 'package.json', 'bun.lock']

const matching_production_trigger = {
	trigger_uuid: 'trigger-prod',
	build_command,
	deploy_command: production_deploy_command,
	branch_includes: ['main'],
	path_includes: www_watch_paths,
	build_caching_enabled: true,
}

// Both triggers are expected to carry the same derived watch paths -- the non-production one
// included, so a PR only fires previews for the apps it actually touches (GitHub issue #74).
const matching_non_production_trigger = {
	trigger_uuid: 'trigger-preview',
	build_command,
	deploy_command: non_production_deploy_command,
	branch_includes: ['*'],
	path_includes: www_watch_paths,
	build_caching_enabled: true,
}

function router_fetch(handler: (url: string, init?: RequestInit) => Response): typeof fetch {
	return mock(async (url: string, init?: RequestInit) => handler(url, init)) as unknown as typeof fetch
}

function triggers_response(triggers: unknown[]) {
	return new Response(JSON.stringify({ result: triggers }), { status: 200 })
}

function env_vars_response(vars: Record<string, { value: string; is_secret: boolean }>) {
	return new Response(JSON.stringify({ result: vars }), { status: 200 })
}

describe('reconcile_workers', () => {
	it('reports both triggers unchanged when everything already matches', async () => {
		const fetch_impl = router_fetch((url, init) => {
			const method = init?.method ?? 'GET'
			if (url.includes('/triggers') && url.endsWith('/triggers') && method === 'GET') return triggers_response([matching_production_trigger, matching_non_production_trigger])
			if (url.endsWith('/environment_variables') && method === 'GET') return env_vars_response({ SKIP_DEPENDENCY_INSTALL: { value: 'true', is_secret: false } })
			throw new Error(`Unexpected request: ${method} ${url}`)
		})

		const [plan] = await reconcile_workers(credentials, { apply: false, apps: [test_app] }, fetch_impl)

		expect(plan.production.field_changes).toEqual([])
		expect(plan.production.env_var_changes).toEqual([])
		expect(plan.non_production.field_changes).toEqual([])
		expect(plan.non_production.env_var_changes).toEqual([])
	})

	it('detects a stale build_command and missing environment variable without writing anything when apply is false', async () => {
		const stale_trigger = { ...matching_non_production_trigger, build_command: 'pnpm run build' }
		let patch_calls = 0
		const fetch_impl = router_fetch((url, init) => {
			const method = init?.method ?? 'GET'
			if (url.endsWith('/triggers') && method === 'GET') return triggers_response([matching_production_trigger, stale_trigger])
			if (url.endsWith('/environment_variables') && method === 'GET') return env_vars_response({})
			if (method === 'PATCH') {
				patch_calls++
				return new Response(JSON.stringify({ result: {} }), { status: 200 })
			}
			throw new Error(`Unexpected request: ${method} ${url}`)
		})

		const [plan] = await reconcile_workers(credentials, { apply: false, apps: [test_app] }, fetch_impl)

		expect(plan.non_production.field_changes).toEqual([{ field: 'build_command', from: 'pnpm run build', to: build_command }])
		expect(plan.non_production.env_var_changes).toEqual([{ field: 'SKIP_DEPENDENCY_INSTALL', from: '(unset)', to: 'true' }])
		expect(patch_calls).toBe(0)
	})

	it('PATCHes the drifted fields when apply is true', async () => {
		const stale_trigger = { ...matching_non_production_trigger, build_command: 'pnpm run build' }
		const patched_bodies: unknown[] = []
		const fetch_impl = router_fetch((url, init) => {
			const method = init?.method ?? 'GET'
			if (url.endsWith('/triggers') && method === 'GET') return triggers_response([matching_production_trigger, stale_trigger])
			if (url.endsWith('/environment_variables') && method === 'GET') return env_vars_response({})
			if (url.endsWith('/environment_variables') && method === 'PATCH') {
				patched_bodies.push(JSON.parse(String(init?.body)))
				return new Response(JSON.stringify({ result: {} }), { status: 200 })
			}
			if (url.includes('/builds/triggers/') && method === 'PATCH') {
				patched_bodies.push(JSON.parse(String(init?.body)))
				return new Response(JSON.stringify({ result: {} }), { status: 200 })
			}
			throw new Error(`Unexpected request: ${method} ${url}`)
		})

		const [plan] = await reconcile_workers(credentials, { apply: true, apps: [test_app] }, fetch_impl)

		expect(plan.non_production.field_changes).toEqual([{ field: 'build_command', from: 'pnpm run build', to: build_command }])
		expect(patched_bodies).toContainEqual(expect.objectContaining({ build_command }))
		expect(patched_bodies).toContainEqual({ SKIP_DEPENDENCY_INSTALL: { value: 'true', is_secret: false } })
	})

	it('scopes an unscoped non-production trigger down to the app\'s own watch paths', async () => {
		const unscoped_trigger = { ...matching_non_production_trigger, path_includes: ['*'] }
		const patched_bodies: unknown[] = []
		const fetch_impl = router_fetch((url, init) => {
			const method = init?.method ?? 'GET'
			if (url.endsWith('/triggers') && method === 'GET') return triggers_response([matching_production_trigger, unscoped_trigger])
			if (url.endsWith('/environment_variables') && method === 'GET') return env_vars_response({ SKIP_DEPENDENCY_INSTALL: { value: 'true', is_secret: false } })
			if (url.includes('/builds/triggers/') && method === 'PATCH') {
				patched_bodies.push(JSON.parse(String(init?.body)))
				return new Response(JSON.stringify({ result: {} }), { status: 200 })
			}
			throw new Error(`Unexpected request: ${method} ${url}`)
		})

		const [plan] = await reconcile_workers(credentials, { apply: true, apps: [test_app] }, fetch_impl)

		expect(plan.non_production.field_changes).toEqual([{ field: 'path_includes', from: ['*'], to: www_watch_paths }])
		expect(plan.production.field_changes).toEqual([])
		expect(patched_bodies).toEqual([expect.objectContaining({ path_includes: www_watch_paths })])
	})

	it('throws if a worker does not have exactly one production and one non-production trigger', async () => {
		const fetch_impl = router_fetch((url, init) => {
			const method = init?.method ?? 'GET'
			if (url.endsWith('/triggers') && method === 'GET') return triggers_response([matching_production_trigger])
			throw new Error(`Unexpected request: ${method} ${url}`)
		})

		await expect(reconcile_workers(credentials, { apply: false, apps: [test_app] }, fetch_impl)).rejects.toThrow(/exactly one production and one non-production trigger/)
	})
})
