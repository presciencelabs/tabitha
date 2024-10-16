<script>
	import CopyButton from '$lib/CopyButton.svelte'
	import Icon from '@iconify/svelte'

	let entered_text = ''
	let temperature = 0.0
	let frequency_penalty = 0.0
	let presence_penalty = 2.0
	
	let phase1_text = ''
	let finish_reason = ''

	$: generating = false

	async function generate_phase1() {
		generating = true

		const response = await fetch('/ai-assist/generate', {
			method: 'POST',
			body: JSON.stringify({
				message: entered_text,
				temperature,
				frequency_penalty,
				presence_penalty,
			}),
		})

		const generate_response = await response.json()

		phase1_text = generate_response.message
		finish_reason = generate_response.finish_reason

		generating = false
	}

	function clear() {
		entered_text = ''
	}
</script>

<form class="grid justify-items-center">
	<!-- svelte-ignore a11y-autofocus -->
	<textarea bind:value={entered_text} rows="6" autofocus class="textarea textarea-bordered textarea-lg w-4/5" />

	<div class="w-4/5 mt-8">
		<label>
			Temperature
			<input type="number" bind:value={temperature} step="0.1" min="0" max="2" />
		</label>
		<label>
			Frequency Penalty
			<input type="number" bind:value={frequency_penalty} step="0.1" min="-2" max="2" />
		</label>
		<label>
			Presence Penalty
			<input type="number" bind:value={presence_penalty} step="0.1" min="-2" max="2" />
		</label>
	</div>

	<div class="w-4/5 mt-8 grid grid-cols-3">
		<div class="flex flex-row flex-wrap col-span-2">
			<button on:click={ clear } class="btn btn-secondary">
				Clear
	
				<Icon icon="mdi:clear-bold" class="h-6 w-6" />
			</button>
		</div>
		
		<div class="justify-self-end">
			<button on:click={ generate_phase1 } class="btn btn-primary" type="submit" disabled={generating}>
				Generate
	
				<Icon icon="mdi:robot" class="h-6 w-6" />
			</button>
		</div>
	</div>
</form>

{#if generating}
	<div class="divider my-12 divider-warning">
		<Icon icon="line-md:loading-twotone-loop" class="h-16 w-16 text-warning" />
	</div>
{:else if finish_reason && finish_reason !== 'stop' }
	<div class="divider divider-error my-12">
		<Icon icon="mdi:close-circle" class="h-16 w-16 text-error" />
	</div>
	<p>AI generation failed: "{finish_reason}". Please try again.</p>
{:else if phase1_text }
	<div class="divider divider-success my-12">
		<Icon icon="mdi:check-circle" class="h-16 w-16 text-success" />
	</div>

	<section class="mx-auto grid justify-items-center text-lg">
		<div class="prose mb-4 mt-4 max-w-none">
			<h2>AI-generated Phase 1</h2>
		</div>

		<textarea bind:value={phase1_text} rows="6" class="textarea textarea-bordered textarea-lg w-4/5"/> 

		<CopyButton content={phase1_text} classes="mt-8 gap-4 self-center">
			Copy Phase 1
		</CopyButton>
	</section>
{/if}

<style lang="postcss">
	/* had to override daisyui's sizing so I could make the line bigger */
	.divider::before,
	.divider::after {
		@apply h-2;
	}
</style>
