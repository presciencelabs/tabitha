<script>
	import '$lib/app.css'

	import { Brand, Search } from '$lib'
</script>

<!-- layout not handled by daisyUI, https://daisyui.com/docs/layout-and-typography -->

<header class="grid grid-cols-[auto_1fr] mx-8 mt-8">
	<Brand />

	<Search />
</header>

<main class="mx-8 mt-8">
	<slot />
</main>

<footer class="footer footer-horizontal mt-20 max-w-none bg-neutral p-10 text-neutral-content">
	<nav class="justify-self-end">
		<a href="/lookup/status/Bible" class="link link-hover">Bible encoding status</a>
		<a href="/lookup/features" class="link link-hover">Source features list</a>
	</nav>
</footer>
