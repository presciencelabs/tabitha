<script>
	import '$lib/app.postcss'
	import Brand from '$lib/Brand.svelte'
	import Search from '$lib/Search.svelte'
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
	<slot></slot>
</main>

<!-- https://daisyui.com/components/footer -->
<footer class="footer bg-secondary text-secondary-content mt-20 p-10 prose max-w-none">
	<nav>
		<header class="footer-title">Theme</header>

		<Selector colors="bg-accent text-accent-content" />
	</nav>

	<nav class="place-self-start md:justify-self-end">
		<header class="footer-title">Administer</header>

		<!-- https://daisyui.com/components/link -->
		<a href="//btn.social" target="_blank" class="indicator">
			Update data
			<span data-tip="TBD: still need to integrate auth" class="indicator-item badge badge-xs badge-warning tooltip tooltip-left" />
		</a>

		<a href="//alltheword.org/downloads-software-bible" target="_blank">
			<pre>{data.version}</pre>
		</a>
	</nav>
</footer>

<style lang="postcss">
	a {
		@apply link link-hover;
	}
</style>
