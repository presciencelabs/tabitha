<script>
	import Icon from '@iconify/svelte'

	let entered_text = ''
	let errors = false

	$: success = entered_text && !errors
	$: tokens = entered_text && entered_text.split(' ').filter(not_empty)


	function not_empty(text = '') {
		return text.trim().length > 0
	}
</script>

<form class="grid justify-items-center">
	<!-- svelte-ignore a11y-autofocus -->
	<textarea bind:value={entered_text} rows="5" autofocus class="textarea textarea-bordered textarea-lg w-4/5" />
</form>

<div class="divider my-12" class:divider-success={success} class:divider-error={errors} >
	{#if entered_text}
		{#if success}
			<Icon icon="mdi:check-outline" class="w-24 h-24 text-success" />
		{:else}
			<Icon icon="mdi:close-outline" class="w-24 h-24 text-error" />
		{/if}
	{/if}
</div>

<section class="flex gap-4 flex-wrap p-8">
	{#each tokens as token}
		<span class="badge badge-outline badge-lg p-6">
			{token}
		</span>
	{/each}
</section>

<style lang="postcss">
	/* had to override daisyui's sizing so I could make the line bigger */
	.divider::before,
	.divider::after {
		@apply h-2;
	}
</style>