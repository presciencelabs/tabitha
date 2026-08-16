import { $ } from 'bun'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const script_dir = fileURLToPath(new URL('.', import.meta.url))
const root_dir = resolve(script_dir, '../../..')
const apps_dir = join(root_dir, 'apps')

function get_today_iso_date(): string {
	const now = new Date()
	const year = now.getFullYear()
	const month = String(now.getMonth() + 1).padStart(2, '0')
	const day = String(now.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

async function audit_and_update_cloudflare_compat_dates() {
	console.log('☁️  Checking Cloudflare Workers compatibility dates...')
	const today_date = get_today_iso_date()
	const app_entries = await readdir(apps_dir, { withFileTypes: true })
	const app_dirs = app_entries.filter(d => d.isDirectory()).map(d => d.name)

	let updated_count = 0

	for (const app_name of app_dirs) {
		const wrangler_path = join(apps_dir, app_name, 'wrangler.jsonc')
		try {
			const content = await readFile(wrangler_path, 'utf-8')
			const date_match = content.match(/"compatibility_date":\s*"(\d{4}-\d{2}-\d{2})"/)

			if (!date_match) continue

			const current_date = date_match[1]
			if (current_date < today_date) {
				const updated_content = content.replace(
					`"compatibility_date": "${current_date}"`,
					`"compatibility_date": "${today_date}"`,
				)
				await writeFile(wrangler_path, updated_content, 'utf-8')
				console.log(`   ✨ ${app_name}: Advanced compatibility_date from ${current_date} -> ${today_date}`)
				updated_count++
			} else {
				console.log(`   ✓ ${app_name}: compatibility_date is up to date (${current_date})`)
			}
		} catch {
			// File doesn't exist
		}
	}

	if (updated_count > 0) {
		console.log(`   🎉 Updated compatibility_date across ${updated_count} Cloudflare Worker config(s).\n`)
	} else {
		console.log('   ✓ All Cloudflare compatibility dates are current.\n')
	}
}

async function audit_workspace_skills() {
	console.log('🧠 Auditing workspace AI skills (.agents/skills)...')
	const skills_dir = resolve(root_dir, '../.agents/skills')
	try {
		const entries = await readdir(skills_dir, { withFileTypes: true })
		const skill_names = entries.filter(e => e.isDirectory()).map(e => e.name)
		console.log(`   ✓ Active skills (${skill_names.length}): ${skill_names.join(', ')}\n`)
	} catch {
		// Directory not present
	}
}

async function regenerate_worker_and_framework_types() {
	console.log('🔄 Regenerating SvelteKit & Cloudflare Worker type artifacts...')
	try {
		await $`pnpm --filter tabitha-ontology exec wrangler types ./worker-configuration.d.ts`.quiet()
		console.log('   ✓ Regenerated Cloudflare Worker types for ontology.\n')
	} catch (err: any) {
		console.warn('   ⚠️  Could not regenerate wrangler types:', err?.message || err)
	}
}

async function run_safe_update() {
	console.log(`
============================================================
      📦 TaBiThA Safe Dependency & Maintenance Updater      
============================================================
`)

	// 1. Tooling & Engine Audit
	console.log('🔍 Auditing toolchain versions...')
	try {
		const node_ver = (await $`node -v`.text()).trim()
		const bun_ver = (await $`bun --version`.text()).trim()
		const pnpm_ver = (await $`pnpm --version`.text()).trim()

		console.log(`   • Node.js:  ${node_ver}`)
		console.log(`   • Bun:      v${bun_ver}`)
		console.log(`   • pnpm:     v${pnpm_ver}\n`)
	} catch (err: any) {
		console.warn('   ⚠️  Could not determine toolchain versions:', err?.message || err)
	}

	// 2. Workspace Skills Audit
	await audit_workspace_skills()

	// 3. Cloudflare Compatibility Date Maintenance
	await audit_and_update_cloudflare_compat_dates()

	// 4. Non-Breaking SemVer Dependency Update
	console.log('📦 Updating workspace dependencies within declared SemVer ranges (non-breaking)...')
	try {
		await $`pnpm update --recursive`
		console.log('✅ Workspace dependencies safely updated!\n')
	} catch (err: any) {
		console.error('❌ Dependency update encountered an error:', err?.message || err)
		process.exit(1)
	}

	// 5. Regenerate Worker & Framework Types
	await regenerate_worker_and_framework_types()

	// 6. Automated Post-Update Health Verification Gate
	console.log('🧪 Running post-update verification gate...')

	console.log('   1/3 Running workspace static analysis & typecheck (pnpm check)...')
	try {
		await $`pnpm check`
		console.log('   ✓ Static analysis & typecheck passed cleanly!')
	} catch (err: any) {
		console.error('❌ Post-update check failed:', err?.message || err)
		process.exit(1)
	}

	console.log('   2/3 Running unit test suites (pnpm test:unit)...')
	try {
		await $`pnpm test:unit`
		console.log('   ✓ All unit test suites passed!')
	} catch (err: any) {
		console.error('❌ Post-update unit tests failed:', err?.message || err)
		process.exit(1)
	}

	console.log('   3/3 Verifying production Cloudflare Worker bundles (pnpm build)...')
	try {
		await $`pnpm build`
		console.log('   ✓ All 5 Cloudflare Worker bundles built successfully!')
	} catch (err: any) {
		console.error('❌ Post-update production build failed:', err?.message || err)
		process.exit(1)
	}

	console.log(`
============================================================
🎉 Safe Update Complete & 100% Verified!

All dependencies have been safely advanced within their
SemVer minor/patch boundaries, and all tests and builds passed.

To commit the updates:
  git add pnpm-lock.yaml package.json apps/ packages/
  git commit -m "chore(deps): safe dependency update"
============================================================
`)
}

if (import.meta.main) {
	await run_safe_update()
}
