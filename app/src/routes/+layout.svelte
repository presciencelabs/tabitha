<script>
	import '$lib/app.postcss'
	import { Selector } from '$lib/theme'

	export let data
</script>

<!-- layout not handled by daisyUI, https://daisyui.com/docs/layout-and-typography -->

<slot />

<!-- https://daisyui.com/components/footer -->
<footer class="prose footer mt-20 max-w-none bg-neutral p-10 text-neutral-content">
	<nav>
		<header class="footer-title">Theme</header>

		<Selector colors="bg-accent text-accent-content" />
	</nav>

	<nav class="place-self-start md:justify-self-end">
		<header class="footer-title">Administer</header>

		<!-- https://daisyui.com/components/link -->
		<a href="//alltheword.org/downloads-software-bible" target="_blank" class="font-mono link link-hover">
			{data.version}
		</a>
	</nav>
</footer>
