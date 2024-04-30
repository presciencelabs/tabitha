<script>
	import CopyButton from '$lib/CopyButton.svelte'
	import { SaveButton, saved } from '$lib/save'
	import { Tokens } from '$lib/tokens'
	import Icon from '@iconify/svelte'

	let entered_text = $saved
	$: checking = false
	$: check_response = { has_error: false, tokens: [], back_translation: '' }

	async function check_text() {
		checking = true
		const response = await fetch(`/check?text=${entered_text}`)
		check_response = await response.json()
		checking = false
	}

	function clear() {
		entered_text = ''
	}
</script>

<form class="grid justify-items-center">
	<!-- svelte-ignore a11y-autofocus -->
	<textarea bind:value={entered_text} rows="5" autofocus class="textarea textarea-bordered textarea-lg w-4/5" />

	<div class="w-4/5 mt-8 grid grid-cols-3">
		<div class="flex flex-row flex-wrap col-span-2">
			<button on:click={ clear } class="btn btn-secondary">
				Clear
	
				<Icon icon="mdi:clear-bold" class="h-6 w-6" />
			</button>
	
			<CopyButton content={entered_text} classes="ms-4">
				Copy Phase 1
			</CopyButton>
	
			<SaveButton content={entered_text} classes="ms-4" />
		</div>
		
		<div class="justify-self-end">
			<button on:click={ check_text } class="btn btn-primary" type="submit" disabled={checking}>
				Check
	
				<Icon icon="mdi:format-list-checks" class="h-6 w-6" />
			</button>
		</div>
	</div>
</form>

{#if checking}
	<div class="divider my-12 divider-warning">
		<Icon icon="line-md:loading-twotone-loop" class="h-16 w-16 text-warning" />
	</div>
{:else}
	{@const { has_error, tokens, back_translation } = check_response}
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

	{#if back_translation}
		<div class="prose divider mb-12 mt-20 max-w-none">
			<h2>English back translation</h2>
		</div>

		<section class="prose mx-auto flex flex-col text-lg">
			<p>
				{back_translation}
			</p>

			<CopyButton content={back_translation} classes="mt-8 gap-4 self-center">
				Copy back translation
			</CopyButton>
		</section>
	{/if}
{/if}

<style lang="postcss">
	/* had to override daisyui's sizing so I could make the line bigger */
	.divider::before,
	.divider::after {
		@apply h-2;
	}
</style>
