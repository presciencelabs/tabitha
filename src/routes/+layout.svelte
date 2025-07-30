<script>
	import '$lib/app.css'

	import { Brand } from '$lib'
	import { Selector } from '$lib/theme'
</script>

<!-- layout not handled by daisyUI, https://daisyui.com/docs/layout-and-typography -->
<header class="mx-8 mt-8">
	<Brand />
</header>

<main class="mx-8 mt-8">
	<slot />
</main>

<!-- https://daisyui.com/components/footer -->
<footer class="prose footer mt-20 max-w-none bg-neutral p-10 text-neutral-content">
	<nav>
		<header class="footer-title">Theme</header>

		<Selector colors="bg-accent text-accent-content" />
	</nav>
</footer>
