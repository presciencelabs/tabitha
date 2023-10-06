<script>
	import '$lib/app.css'
	import Brand from '$lib/Brand.svelte'
	import Search from '$lib/Search.svelte'

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
<footer class="footer place-items-end bg-neutral text-neutral-content mt-20 p-10">
	<nav>
		<header class="footer-title">Administer</header>

		<!-- https://daisyui.com/components/link -->
		<a href="https://btn.social" target="_blank" class="link link-hover">Administer</a>
	</nav>
</footer>

