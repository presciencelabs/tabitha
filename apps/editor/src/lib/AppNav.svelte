<script lang="ts">
	import { page } from '$app/state'

	const links = [
		{ name: 'Home', href: '/' },
		{ name: 'AI Assist', href: '/ai-assist' },
	]
</script>

<nav aria-label="Editor sections">
	<div class="tabs tabs-border">
		{#each links as { name, href }}
			<a
				{href}
				class="tab {page.url.pathname === href ? 'tab-active' : ''}"
				aria-current={page.url.pathname === href ? 'page' : undefined}>{name}</a>
		{/each}
	</div>
</nav>
