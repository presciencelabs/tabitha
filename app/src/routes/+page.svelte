<script>
	import Icon from '@iconify/svelte'
	import {parse} from '$lib/parser'
	import {backtranslate} from '$lib/backtranslator'
	import {Tokens} from '$lib/tokens'
	import {token_has_error} from '$lib/parser/token'

	let entered_text = ''
	$: english_back_translation = backtranslate(entered_text)
	$: english_back_translation && reset_copied()

	let copied = false
	async function copy() {
		// https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText
		await navigator.clipboard.writeText(english_back_translation)

		copied = true
	}

	function reset_copied() {
		copied = false
	}
</script>

<form class="grid justify-items-center">
	<!-- svelte-ignore a11y-autofocus -->
	<textarea bind:value={entered_text} rows="5" autofocus class="textarea textarea-bordered textarea-lg w-4/5" />
</form>

{#await parse(entered_text)}
	<div class="divider my-12 divider-warning">
		<Icon icon="line-md:loading-twotone-loop" class="h-16 w-16 text-warning" />
	</div>
{:then tokens} 
	{@const has_error = tokens.some(token_has_error)}
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

		<button on:click={copy} class="btn btn-secondary mt-8 gap-4 self-center">
			Copy to clipboard

			{#if copied}
				<Icon icon="mdi:check" class="h-6 w-6" />
			{:else}
				<Icon icon="mdi:content-copy" class="h-6 w-6" />
			{/if}
		</button>
	</section>
{/if}

<style lang="postcss">
	/* had to override daisyui's sizing so I could make the line bigger */
	.divider::before,
	.divider::after {
		@apply h-2;
	}
</style>
