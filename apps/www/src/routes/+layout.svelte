<script lang="ts">
	import '$lib/app.css'
	import type { Snippet } from 'svelte'

	let { children }: { children?: Snippet } = $props()
</script>

<div class="site">
	<header class="site-header">
		<a href="/" class="wordmark">TaBiThA</a>
	</header>

	<main class="site-main">
		{#if children}
			{@render children()}
		{/if}
	</main>

	<footer class="site-footer">
		<a href="https://github.com/presciencelabs/tabitha" class="footer-link">GitHub</a>
	</footer>
</div>
