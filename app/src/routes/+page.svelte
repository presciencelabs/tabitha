<script>
	import Icon from '@iconify/svelte'
	import {check} from '$lib/checks'

	let entered_text = ''

	$: checked_tokens = check(entered_text)
	$: has_error = checked_tokens.some(token => !!token.messages.length)
	$: success = checked_tokens.length && !has_error
</script>

<form class="grid justify-items-center">
	<!-- svelte-ignore a11y-autofocus -->
	<textarea bind:value={entered_text} rows="5" autofocus class="textarea textarea-bordered textarea-lg w-4/5" />
</form>

<div class="divider my-12" class:divider-success={success} class:divider-error={has_error}>
	<span class:text-success={success} class:text-error={has_error} class="prose text-2xl">
		Phase 1 encoding
	</span>

	{#if success}
		<Icon icon={`mdi:check-circle`} class="h-16 w-16 text-success" />
	{:else if has_error}
		<Icon icon={`mdi:close-circle`} class="h-16 w-16 text-error" />
	{/if}
</div>

<section class="prose max-w-none flex flex-wrap gap-x-4 gap-y-8">
	{#each checked_tokens as checked_token}
		{@const {messages, token} = checked_token}
		{@const has_errors = !!messages.length}
		{@const is_punctuation = ['[', ']', '.', ','].includes(token)}
		{@const is_sp_notation = token.startsWith('_')}
		{@const is_word = !is_punctuation && !is_sp_notation}

		<div class:tooltip={has_errors} class:tooltip-error={has_errors} data-tip={messages.join(' ⎯ ')}>
			<span class:badge-error={has_errors} class:badge-outline={is_word} class="badge badge-lg p-4 text-lg tracking-widest">
				{#if has_errors}
					<Icon icon="mdi:close-circle" class="h-6 w-6 me-2" />

					<span class:font-mono={is_sp_notation}>
						{token}
					</span>
				{:else}
					<span class:text-5xl={is_punctuation} class:font-thin={is_punctuation} class:font-mono={is_sp_notation}>
						{token}
					</span>
				{/if}

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
