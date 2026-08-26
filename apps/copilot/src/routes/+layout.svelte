<script>
	import '$lib/app.css'

	import { Brand, Footer } from '@tabitha/ui'

	let { children } = $props()
</script>

<div class="app">
	<header class="grid grid-cols-[auto_1fr] mx-8 mt-8">
		<Brand app="Copilot" />
	</header>

	<div role="alert" class="alert alert-error mx-8">
		<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
		</svg>
		<span>Tabitha Co-Pilot is undergoing experimentation at this time. Please check back soon for beta releases.</span>
	</div>

	<main class="mx-8 mt-8">
		{@render children()}
	</main>

	<Footer />
</div>
