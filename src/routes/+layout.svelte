<script>
	import '$lib/app.postcss'
	import { Brand } from '$lib'
</script>

<!-- layout not handled by daisyUI, https://daisyui.com/docs/layout-and-typography -->

<header class="grid grid-cols-[auto_1fr] mx-8 mt-8">
	<Brand />
</header>

<main class="mx-8 mt-8">
	<slot />
</main>
