<script>
	import CopyButton from '$lib/CopyButton.svelte'
	import { SaveButton, saved } from '$lib/save'
	import { Tokens } from '$lib/tokens'
	import Icon from '@iconify/svelte'

	let entered_text = $saved
	$: checking = false
	$: check_response = { status: 'ok', tokens: [], back_translation: '' }

	async function check_text() {
		checking = true
		const response = await fetch(`/check?text=${sanitize_input(entered_text)}`)
		check_response = await response.json()
		checking = false
	}

	/**
	 * @param {string} text 
	 */
	function sanitize_input(text) {
		return text.replaceAll('\n', ' ')
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
	{@const { status, tokens, back_translation } = check_response}

	{#if tokens.length === 0}
		<div class="divider my-12"></div>
	{:else if status === 'ok'}
		<div class="divider divider-success my-12">
			<Icon icon="mdi:check-circle" class="h-16 w-16 text-success" />
		</div>
	{:else if status === 'error'}
		<div class="divider divider-error my-12">
			<Icon icon="mdi:close-circle" class="h-16 w-16 text-error" />
		</div>
	{:else if status === 'warning'}
		<div class="divider divider-warning my-12">
			<Icon icon="mdi:alert-circle" class="h-16 w-16 text-warning" />
		</div>
	{/if}

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
