<script>
	import CopyButton from '$lib/CopyButton.svelte'
	import { backtranslate } from '$lib/backtranslator'
	import { parse } from '$lib/parser'
	import { token_has_error } from '$lib/parser/token'
	import { SaveButton, saved } from '$lib/save'
	import { Tokens } from '$lib/tokens'
	import Icon from '@iconify/svelte'

	let entered_text = $saved
	$: english_back_translation = backtranslate(entered_text)

	/**
	 * @param {Token[]} tokens
	 */
	function check_for_error(tokens) {
		return tokens.some(token => token_has_error(token)
			|| token.complex_pairing && token_has_error(token.complex_pairing)
			|| token.pronoun && token_has_error(token.pronoun))
	}

	function clear() {
		entered_text = ''
	}
</script>

<form class="grid justify-items-center">
	<!-- svelte-ignore a11y-autofocus -->
	<textarea bind:value={entered_text} rows="5" autofocus class="textarea textarea-bordered textarea-lg w-4/5" />

	<div class="mt-8">
		<button on:click={ clear } class="btn btn-secondary">
			Clear

			<Icon icon="mdi:clear-bold" class="h-6 w-6" />
		</button>

		<CopyButton content={entered_text} classes="ms-4" />

		<SaveButton content={entered_text} classes="ms-4" />
	</div>
</form>

{#await parse(entered_text)}
	<div class="divider my-12 divider-warning">
		<Icon icon="line-md:loading-twotone-loop" class="h-16 w-16 text-warning" />
	</div>
{:then tokens}
	{@const has_error = check_for_error(tokens)}
	{@const success = tokens.length > 0 && !has_error}

	<div class="divider my-12" class:divider-success={success} class:divider-error={has_error}>
		{#if success}
			<Icon icon="mdi:check-circle" class="h-16 w-16 text-success" />
		{:else if has_error}
			<Icon icon="mdi:close-circle" class="h-16 w-16 text-error" />
		{/if}
	</div>

	<section class="prose flex max-w-none flex-wrap items-center justify-center gap-x-4 gap-y-8">
		<Tokens {tokens} />
	</section>
{/await}

{#if english_back_translation}
	<div class="prose divider mb-12 mt-20 max-w-none">
		<h2>English back translation</h2>
	</div>

	<section class="prose mx-auto flex flex-col text-lg">
		<p>
			{english_back_translation}
		</p>

		<CopyButton content={english_back_translation} classes="mt-8 gap-4 self-center" />
	</section>
{/if}

<style lang="postcss">
	/* had to override daisyui's sizing so I could make the line bigger */
	.divider::before,
	.divider::after {
		@apply h-2;
	}
</style>
