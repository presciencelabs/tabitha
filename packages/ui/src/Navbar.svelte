<script lang="ts">
	import type { Snippet } from 'svelte'
	import Brand from './Brand.svelte'
	import ThemeSelector from './themes/ThemeSelector.svelte'

	interface AppLink {
		name: string
		href: string
		active?: boolean
	}

	interface Props {
		current_app: 'Ontology' | 'Sources' | 'Targets' | 'Editor' | 'Copilot'
		links?: AppLink[]
		children?: Snippet
		actions?: Snippet
	}

	let {
		current_app,
		links = [
			{ name: 'Ontology', href: 'http://localhost.tabitha.bible:5173' },
			{ name: 'Sources', href: 'http://localhost.tabitha.bible:8789' },
			{ name: 'Targets', href: 'http://localhost.tabitha.bible:8788' },
			{ name: 'Editor', href: 'http://localhost.tabitha.bible:8790' },
			{ name: 'Copilot', href: 'http://localhost.tabitha.bible:8793' },
		],
		children,
		actions,
	}: Props = $props()
</script>

<header class="navbar bg-base-100 border-b border-base-300 px-4">
	<div class="navbar-start gap-2">
		<Brand app={current_app} />
	</div>

	<div class="navbar-center hidden lg:flex">
		<ul class="menu menu-horizontal gap-1 px-1">
			{#each links as link}
				<li>
					<a
						href={link.href}
						class="text-sm font-medium {link.name === current_app ? 'active font-bold' : ''}"
					>
						{link.name}
					</a>
				</li>
			{/each}
		</ul>
		{#if children}
			{@render children()}
		{/if}
	</div>

	<div class="navbar-end gap-2">
		{#if actions}
			{@render actions()}
		{/if}
		<ThemeSelector />
	</div>
</header>
