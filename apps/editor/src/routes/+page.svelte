<script lang="ts">
	import type { CheckResponse } from '@tabitha/types'
	import CopyButton from '$lib/CopyButton.svelte'
	import { SaveButton, save_state } from '$lib/save'
	import { Tokens } from '$lib/tokens'
	import { fetch_check_result } from '$lib/check'
	import Icon from '@iconify/svelte'

	let entered_text = $state(save_state.value)
	let checking = $state(false)
	let check_response = $state<CheckResponse>({ status: 'ok', tokens: [], back_translation: '' })

	async function check_text() {
		checking = true
		check_response = await fetch_check_result(sanitize_input(entered_text))
		checking = false
	}

	function sanitize_input(text: string): string {
		return text.replaceAll('\n', ' ')
	}

	function clear() {
		entered_text = ''
	}
</script>

<form class="grid justify-items-center">
	<!-- svelte-ignore a11y_autofocus -->
	<textarea bind:value={entered_text} rows="5" autofocus class="textarea textarea-bordered textarea-lg w-4/5"></textarea>

	<div class="w-4/5 mt-8 grid grid-cols-3">
		<div class="flex flex-row flex-wrap col-span-2">
			<button onclick={ clear } class="btn btn-secondary">
				Clear

				<Icon icon="mdi:clear-bold" class="h-6 w-6" />
			</button>

			<CopyButton content={entered_text} classes="ms-4">
				Copy Phase 1
			</CopyButton>

			<SaveButton content={entered_text} classes="ms-4" />
		</div>

		<div class="justify-self-end">
			<button onclick={ check_text } type="submit" disabled={checking} class="btn btn-primary">
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

	<section class="flex flex-wrap items-center justify-center gap-x-4 gap-y-8">
		<Tokens {tokens} />
	</section>

	{#if back_translation}
		<div class="prose divider mb-12 mt-20 max-w-none">
			<h2>English back translation</h2>
		</div>

		<section class="mx-auto flex flex-col">
			<p class="prose text-lg">
				{back_translation}
			</p>

			<CopyButton content={back_translation} classes="mt-8 gap-4 self-center">
				Copy back translation
			</CopyButton>
		</section>
	{/if}
{/if}

<style lang="postcss">
	@reference '$lib/app.css';

	/* had to override daisyui's sizing so I could make the line bigger */
	.divider::before,
	.divider::after {
		@apply h-2;
	}
</style>
