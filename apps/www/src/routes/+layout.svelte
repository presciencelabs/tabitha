<script lang="ts">
	import '$lib/app.css'
	import type { Snippet } from 'svelte'

	let { children }: { children?: Snippet } = $props()
</script>

<header class="mx-8 mt-8">
	<a href="/" class="text-xl font-bold">TaBiThA</a>
</header>

<main class="mx-8 mt-8">
	{#if children}
		{@render children()}
	{/if}
</main>

<footer class="mx-8 mt-8 mb-8">
	<a href="https://github.com/presciencelabs/tabitha" class="link link-hover">GitHub</a>
</footer>
