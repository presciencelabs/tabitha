<script>
	import Brand from '$lib/Brand.svelte'

	let { children } = $props()
</script>

<div class="app">
	<header class="grid grid-cols-[auto_1fr] mx-8 mt-8">
		<Brand />
	</header>

	<main class="mx-8 mt-8">
		{@render children()}
	</main>
</div>
