<script lang="ts">
	import { page } from '$app/state'

	const links = [
		{ name: 'Check', href: '/' },
		{ name: 'AI Assist', href: '/ai-assist' },
	]
</script>

<nav>
	<ul class="menu menu-horizontal gap-1 px-0">
		{#each links as { name, href }}
			<li>
				<a {href} class="text-sm font-medium {page.url.pathname === href ? 'active font-bold' : ''}">{name}</a>
			</li>
		{/each}
	</ul>
</nav>
