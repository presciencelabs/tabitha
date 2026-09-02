import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const script_dir = fileURLToPath(new URL('.', import.meta.url))
const root_dir = resolve(script_dir, '../..')

export type BadgeVersionInfo = {
	readonly bun: string
	readonly svelte: string
	readonly tailwind: string
	readonly daisyui: string
}

export type BadgeFinding = {
	readonly badge_name: string
	readonly expected: string
	readonly current: string
	readonly message: string
}

export type AuditBadgesResult = {
	readonly is_synced: boolean
	readonly findings: readonly BadgeFinding[]
	readonly updated_content: string
}

const extract_semver_major = (version_str: string): string => {
	const cleaned = version_str.replace(/^[^\d]*/, '')
	const parts = cleaned.split('.')
	return parts[0] || ''
}

const extract_semver_major_minor = (version_str: string): string => {
	const cleaned = version_str.replace(/^[^\d]*/, '')
	const parts = cleaned.split('.')
	if (parts.length >= 2) {
		return `${parts[0]}.${parts[1]}`
	}
	return parts[0] || ''
}

export const extract_expected_badge_versions = async (
	base_dir: string = root_dir,
): Promise<BadgeVersionInfo> => {
	const root_pkg_path = join(base_dir, 'package.json')
	const ontology_pkg_path = join(base_dir, 'apps/ontology/package.json')

	const root_pkg = JSON.parse(await readFile(root_pkg_path, 'utf-8'))
	const ontology_pkg = JSON.parse(await readFile(ontology_pkg_path, 'utf-8'))

	const package_manager = root_pkg.packageManager || 'bun@1.4.0'
	const bun_raw = package_manager.replace(/^bun@/, '')
	const bun_version = extract_semver_major_minor(bun_raw)

	const svelte_raw = ontology_pkg.dependencies?.svelte || ontology_pkg.devDependencies?.svelte || '5'
	const svelte_major = extract_semver_major(svelte_raw)

	const tailwind_raw = ontology_pkg.dependencies?.tailwindcss || ontology_pkg.devDependencies?.tailwindcss || '4'
	const tailwind_major = `v${extract_semver_major(tailwind_raw)}`

	const daisyui_raw = ontology_pkg.dependencies?.daisyui || ontology_pkg.devDependencies?.daisyui || '5'
	const daisyui_major = extract_semver_major(daisyui_raw)

	return {
		bun: bun_version,
		svelte: svelte_major,
		tailwind: tailwind_major,
		daisyui: daisyui_major,
	}
}

export const audit_and_sync_badge_content = ({
	content,
	expected_versions,
}: {
	readonly content: string
	readonly expected_versions: BadgeVersionInfo
}): AuditBadgesResult => {
	const findings: BadgeFinding[] = []
	let updated_content = content

	// 1. Bun badge check
	const bun_badge_regex = /<a href="https:\/\/bun\.com"><img src="https:\/\/img\.shields\.io\/badge\/Bun-([^-?]+)-000000[^"]*" alt="Bun" \/><\/a>/
	const bun_match = updated_content.match(bun_badge_regex)
	if (bun_match) {
		const current_bun = bun_match[1]
		if (current_bun !== expected_versions.bun) {
			findings.push({
				badge_name: 'Bun',
				expected: expected_versions.bun,
				current: current_bun,
				message: `Bun badge version (${current_bun}) does not match packageManager (${expected_versions.bun})`,
			})
			const new_badge = `<a href="https://bun.com"><img src="https://img.shields.io/badge/Bun-${expected_versions.bun}-000000?style=flat-square&logo=bun&logoColor=white" alt="Bun" /></a>`
			updated_content = updated_content.replace(bun_badge_regex, new_badge)
		}
	} else {
		findings.push({
			badge_name: 'Bun',
			expected: expected_versions.bun,
			current: 'missing',
			message: 'Bun badge is missing or does not match expected format',
		})
	}

	// 2. Svelte badge check
	const svelte_badge_regex = /<a href="https:\/\/svelte\.dev"><img src="https:\/\/img\.shields\.io\/badge\/Svelte-([^-?]+)-FF3E00[^"]*" alt="Svelte [^"]*" \/><\/a>/
	const svelte_match = updated_content.match(svelte_badge_regex)
	if (svelte_match) {
		const current_svelte = svelte_match[1]
		if (current_svelte !== expected_versions.svelte) {
			findings.push({
				badge_name: 'Svelte',
				expected: expected_versions.svelte,
				current: current_svelte,
				message: `Svelte badge version (${current_svelte}) does not match package dependencies (${expected_versions.svelte})`,
			})
			const new_badge = `<a href="https://svelte.dev"><img src="https://img.shields.io/badge/Svelte-${expected_versions.svelte}-FF3E00?style=flat-square&logo=svelte&logoColor=white" alt="Svelte ${expected_versions.svelte}" /></a>`
			updated_content = updated_content.replace(svelte_badge_regex, new_badge)
		}
	} else {
		findings.push({
			badge_name: 'Svelte',
			expected: expected_versions.svelte,
			current: 'missing',
			message: 'Svelte badge is missing or does not match expected format',
		})
	}

	// 3. Tailwind CSS badge check
	const tailwind_badge_regex = /<a href="https:\/\/tailwindcss\.com"><img src="https:\/\/img\.shields\.io\/badge\/Tailwind_CSS-([^-?]+)-06B6D4[^"]*" alt="Tailwind CSS [^"]*" \/><\/a>/
	const tailwind_match = updated_content.match(tailwind_badge_regex)
	if (tailwind_match) {
		const current_tailwind = tailwind_match[1]
		if (current_tailwind !== expected_versions.tailwind) {
			findings.push({
				badge_name: 'Tailwind CSS',
				expected: expected_versions.tailwind,
				current: current_tailwind,
				message: `Tailwind CSS badge version (${current_tailwind}) does not match package dependencies (${expected_versions.tailwind})`,
			})
			const new_badge = `<a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-${expected_versions.tailwind}-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS ${expected_versions.tailwind}" /></a>`
			updated_content = updated_content.replace(tailwind_badge_regex, new_badge)
		}
	} else {
		findings.push({
			badge_name: 'Tailwind CSS',
			expected: expected_versions.tailwind,
			current: 'missing',
			message: 'Tailwind CSS badge is missing or does not match expected format',
		})
	}

	// 4. daisyUI badge check
	const daisyui_badge_regex = /<a href="https:\/\/daisyui\.com"><img src="https:\/\/img\.shields\.io\/badge\/daisyUI-([^-?]+)-570DF8[^"]*" alt="daisyUI [^"]*" \/><\/a>/
	const daisyui_match = updated_content.match(daisyui_badge_regex)
	if (daisyui_match) {
		const current_daisyui = daisyui_match[1]
		if (current_daisyui !== expected_versions.daisyui) {
			findings.push({
				badge_name: 'daisyUI',
				expected: expected_versions.daisyui,
				current: current_daisyui,
				message: `daisyUI badge version (${current_daisyui}) does not match package dependencies (${expected_versions.daisyui})`,
			})
			const new_badge = `<a href="https://daisyui.com"><img src="https://img.shields.io/badge/daisyUI-${expected_versions.daisyui}-570DF8?style=flat-square&logo=daisyui&logoColor=white" alt="daisyUI ${expected_versions.daisyui}" /></a>`
			updated_content = updated_content.replace(daisyui_badge_regex, new_badge)
		}
	} else {
		findings.push({
			badge_name: 'daisyUI',
			expected: expected_versions.daisyui,
			current: 'missing',
			message: 'daisyUI badge is missing or does not match expected format',
		})
	}

	// 5. Cloudflare badge check (Workers • D1 • R2)
	const expected_cloudflare_badge = '<a href="https://workers.cloudflare.com"><img src="https://img.shields.io/badge/Cloudflare-Workers_%E2%80%A2_D1_%E2%80%A2_R2-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="Cloudflare Workers • D1 • R2" /></a>'
	const cloudflare_badge_regex = /<a href="https:\/\/workers\.cloudflare\.com"><img src="https:\/\/img\.shields\.io\/badge\/Cloudflare-[^"]*" alt="[^"]*" \/><\/a>/
	const cloudflare_match = updated_content.match(cloudflare_badge_regex)
	if (cloudflare_match) {
		if (cloudflare_match[0] !== expected_cloudflare_badge) {
			findings.push({
				badge_name: 'Cloudflare',
				expected: 'Workers • D1 • R2',
				current: cloudflare_match[0],
				message: 'Cloudflare badge does not include Workers • D1 • R2',
			})
			updated_content = updated_content.replace(cloudflare_badge_regex, expected_cloudflare_badge)
		}
	} else {
		findings.push({
			badge_name: 'Cloudflare',
			expected: 'Workers • D1 • R2',
			current: 'missing',
			message: 'Cloudflare badge is missing or does not match expected format',
		})
	}

	return {
		is_synced: findings.length === 0,
		findings,
		updated_content,
	}
}

export const sync_readme_badges = async ({
	base_dir = root_dir,
	should_write = false,
}: {
	readonly base_dir?: string
	readonly should_write?: boolean
}): Promise<AuditBadgesResult> => {
	const readme_path = join(base_dir, 'README.md')
	if (!existsSync(readme_path)) {
		throw new Error(`README.md not found at ${readme_path}`)
	}

	const expected_versions = await extract_expected_badge_versions(base_dir)
	const original_content = await readFile(readme_path, 'utf-8')

	const audit_result = audit_and_sync_badge_content({
		content: original_content,
		expected_versions,
	})

	if (should_write && !audit_result.is_synced) {
		await writeFile(readme_path, audit_result.updated_content, 'utf-8')
	}

	return audit_result
}

async function run_cli() {
	const args = process.argv.slice(2)
	const should_fix = args.includes('--fix') || args.includes('-f') || args.includes('--sync')

	console.log(`
============================================================
       🏷️ TaBiThA README Badge & Package.json Sync Linter     
============================================================
`)

	const result = await sync_readme_badges({
		base_dir: root_dir,
		should_write: should_fix,
	})

	if (result.is_synced) {
		console.log('✅ 100% In Sync! All README badges accurately match package.json versions.\n')
		return
	}

	if (should_fix) {
		console.log(`✨ Automatically synchronized ${result.findings.length} badge(s) in README.md:`)
		for (const finding of result.findings) {
			console.log(`   • ${finding.badge_name}: -> ${finding.expected}`)
		}
		console.log('\n🎉 README.md is now 100% in sync with package.json!\n')
		return
	}

	console.error(`❌ Detected ${result.findings.length} badge version mismatch(es) in README.md:\n`)
	for (const finding of result.findings) {
		console.error(`   • [${finding.badge_name}] ${finding.message}`)
	}
	console.error('\n💡 To automatically synchronize badges, run: bun scripts/audits/check_readme_badges.ts --fix\n')
	process.exit(1)
}

if (import.meta.main) {
	await run_cli()
}
