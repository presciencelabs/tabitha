<script>
	import Icon from '@iconify/svelte'
	import {check} from '$lib/checks'

	let entered_text = ''

	$: checked_tokens = check(entered_text)
	$: has_error = checked_tokens.some(token => !!token.messages.length)
	$: success = checked_tokens.length && !has_error

	/** @param {string} token */
	function is_bracket(token) {
		return ['[', ']'].includes(token)
	}
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

<section class="prose max-w-none flex items-center flex-wrap gap-4 p-8">
	{#each checked_tokens as checked_token}
		{@const {messages, token} = checked_token}
		{@const has_messages = !!messages.length}

		<div class:tooltip={has_messages} class:tooltip-error={has_messages} data-tip={messages.join(' ⎯ ')}>
			<span class:badge-error={has_messages} class:bracket-container={is_bracket(token)} class="badge badge-outline badge-lg gap-2 py-6">
				{#if has_messages}
					<Icon icon="mdi:close-circle" class="h-7 w-7" />
				{/if}

				<span class:bracket={is_bracket(token)} class="text-lg font-bold">
					{token}
				</span>
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

	.bracket-container {
		@apply py-9 mx-4;
	}
	.bracket {
		@apply text-3xl font-thin;
		font-family: math;
	}
</style>
