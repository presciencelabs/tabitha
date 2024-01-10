<script>
	import {Brand, Search} from '$lib'
</script>

<!-- layout not handled by daisyUI, https://daisyui.com/docs/layout-and-typography -->
<header class="grid grid-cols-[auto_1fr]">
	<Brand />

	<Search autofocus />
</header>

<main>
	<slot />
</main>

<style lang="postcss">
	header,
	main {
		@apply mx-8 mt-8;
	}
</style>
