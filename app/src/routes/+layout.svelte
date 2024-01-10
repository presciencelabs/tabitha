<script>
	import '$lib/app.postcss'
	import {Selector} from '$lib/theme'

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

	<nav>
		<header class="footer-title">Tools</header>

		<a href="/p1-to-eng">
			Back translate Phase 1 to ENG
		</a>
	</nav>

	<nav class="place-self-start md:justify-self-end">
		<header class="footer-title">Administer</header>

		<!-- https://daisyui.com/components/link -->
		<!-- <a href="//btn.social" target="_blank" class="indicator">
			Update data
			<span data-tip="TBD: still need to integrate auth" class="badge indicator-item badge-warning badge-xs tooltip tooltip-left" />
		</a> -->

		<a href="//alltheword.org/downloads-software-bible" target="_blank" class="font-mono">
			{data.version}
		</a>
	</nav>
</footer>

<style lang="postcss">
	a {
		@apply link-hover link;
	}
</style>
