<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		app?: string
		version?: string
		children?: Snippet
	}

	let { app = 'TaBiThA', version = '', children }: Props = $props()
</script>

<div class="prose">
	<h1 class="mb-2 hidden md:block">
		{app} <sup class="relative -top-6 end-12 text-xs text-base-content/60">TaBiThA</sup>
	</h1>

	{#if version}
		<div class="flex items-center gap-2 mb-2">
			<span class="text-xs font-mono opacity-70">{version}</span>
		</div>
	{/if}

	{#if children}
		{@render children()}
	{/if}
</div>
