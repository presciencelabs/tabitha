<script>
	import '$lib/app.css'
	import Brand from '$lib/Brand.svelte'
	import Search from '$lib/Search.svelte'
	import { Selector } from '$lib/theme'

</script>

<!-- layout not handled by daisyUI, https://daisyui.com/docs/layout-and-typography -->

<header class="grid grid-cols-[auto_1fr]">
	<Brand />

	<Search autofocus />
</header>

<main>
	<slot></slot>
</main>

<!-- https://daisyui.com/components/footer -->
<footer class="footer bg-neutral text-neutral-content mt-20 p-10">
	<nav>
		<header class="footer-title">Theme</header>

		<Selector colors="bg-accent hover:bg-accent-focus text-accent-content" />
	</nav>

	<nav class="justify-self-end">
		<header class="footer-title">Administer</header>

		<!-- https://daisyui.com/components/link -->
		<a href="https://btn.social" target="_blank" class="link link-accent link-hover prose">Administer</a>
	</nav>
</footer>
