<script lang="ts">
	import type { Snippet } from 'svelte'
	import Brand from './Brand.svelte'
	import Status from './connectivity/Status.svelte'

	interface Props {
		app: string
		children?: Snippet
	}

	let { app, children }: Props = $props()
</script>

<header class="grid grid-cols-[auto_1fr] mx-8 mt-8">
	<div>
		<Brand {app} />
		<Status />
	</div>

	{#if children}
		{@render children()}
	{/if}
</header>
