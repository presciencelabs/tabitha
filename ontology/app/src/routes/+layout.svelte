<script>
	import '$lib/app.postcss'
	import {Brand, Search} from '$lib'
	import {Selector} from '$lib/theme'

	/** @type {import('./$types').PageData} */
	export let data
</script>

<!-- layout not handled by daisyUI, https://daisyui.com/docs/layout-and-typography -->
<header class="grid grid-cols-[auto_1fr]">
	<Brand />

	<Search autofocus />
</header>

<main>
	<slot />
</main>

<!-- https://daisyui.com/components/footer -->
<footer class="prose footer mt-20 max-w-none bg-secondary p-10 text-secondary-content">
	<nav>
		<header class="footer-title">Theme</header>

		<Selector colors="bg-accent text-accent-content" />
	</nav>

	<nav class="place-self-start md:justify-self-end">
		<header class="footer-title">Administer</header>

		<!-- https://daisyui.com/components/link -->
		<a href="//btn.social" target="_blank" class="indicator">
			Update data
			<span data-tip="TBD: still need to integrate auth" class="badge indicator-item badge-warning badge-xs tooltip tooltip-left" />
		</a>

		<a href="//alltheword.org/downloads-software-bible" target="_blank">
			<pre>{data.version}</pre>
		</a>
	</nav>
</footer>

<style lang="postcss">
	header,
	main {
		@apply mx-8 mt-8;
	}

	a {
		@apply link-hover link;
	}
</style>
