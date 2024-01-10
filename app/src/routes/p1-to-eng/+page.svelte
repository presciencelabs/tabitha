<script>
	import {parse} from './back_translate'

	let value = ''
	let eng = ''

	$: eng = parse(value)
</script>


<form class="prose max-w-none h-full">
	<h2>Phase 1</h2>
	<!-- svelte-ignore a11y-autofocus -->
	<textarea placeholder="Enter phase 1 text here" bind:value autofocus class="textarea textarea-bordered textarea-lg ms-8 resize-none min-h-[30%] w-4/5" />

	{#if eng}
		<h2 class="mt-8">English</h2>
		<p class="ms-8 w-4/5 textarea-lg">{eng}</p> <!-- textarea-lg will keep the text's look and feel the same as the entered input -->
	{/if}
</form>
