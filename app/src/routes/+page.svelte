<script>
	import Icon from '@iconify/svelte'
	import {tokenize} from '$lib/checks'

	let entered_text = ''

	$: checked_tokens = tokenize(entered_text)
	$: has_error = checked_tokens.some(token => !!token.message)
	$: success = checked_tokens.length && !has_error
</script>

<form class="grid justify-items-center">
	<!-- svelte-ignore a11y-autofocus -->
	<textarea bind:value={entered_text} rows="5" autofocus class="textarea textarea-bordered textarea-lg w-4/5" />
</form>

<div class="divider my-12" class:divider-success={success} class:divider-error={has_error}>
	{#if entered_text}
		{@const icon = success ? 'check' : 'close'}
		{@const color = success ? 'text-success' : 'text-error'}

		<Icon icon={`mdi:${icon}-circle`} class="h-24 w-24 {color}" />
	{/if}
</div>

<section class="prose flex max-w-none flex-wrap gap-4 p-8">
	{#each checked_tokens as checked_token}
		{@const {message, token} = checked_token}

		<div class:tooltip={message} class:tooltip-error={message} data-tip={message}>
			<span class:badge-error={message} class="badge badge-outline badge-lg gap-2 py-6">
				{#if message}
					<Icon icon="mdi:close-circle" class="h-8 w-8" />
				{/if}

				{token}
			</span>
		</div>
	{/each}
</section>

<style lang="postcss">
	/* had to override daisyui's sizing so I could make the line bigger */
	.divider::before,
	.divider::after {
		@apply h-2;
	}
</style>
