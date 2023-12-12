<script>
	import '$lib/app.postcss'
	import {Brand} from '$lib'
	import {Selector} from '$lib/theme'
</script>

<!-- layout not handled by daisyUI, https://daisyui.com/docs/layout-and-typography -->
<header>
	<Brand />
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
</footer>

<style lang="postcss">
	header,
	main {
		@apply mx-8 mt-8;
	}
</style>
