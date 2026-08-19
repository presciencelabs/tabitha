<script lang="ts">
	import { onMount } from 'svelte'
	import { PUBLIC_TARGETS_API_HOST } from '$env/static/public'
	import type { Reference, TargetTextResult } from '$lib/types'

	type Props = {
		reference: Reference
	}

	let { reference }: Props = $props()

	let loading = $state(true)
	let target_data = $state<TargetTextResult | null>(null)

	async function get_target_data({ id_primary, id_secondary, id_tertiary }: Reference): Promise<TargetTextResult> {
		const response = await fetch(`${PUBLIC_TARGETS_API_HOST}/English/${id_primary}/${id_secondary}/${id_tertiary}`)

		// Show the Unchurched Adults if available, because it's usually the most up-to-date.
		// Otherwise, default to the first audience with text
		const texts: TargetTextResult[] = await response.json()
		return (
			texts.find(text => text.audience === 'Unchurched Adults')
			|| texts.find(text => text.text)
			|| { text: '--', audience: 'none saved yet...' }
		)
	}

	onMount(async () => {
		try {
			target_data = await get_target_data(reference)
		} finally {
			loading = false
		}
	})
</script>

{#if loading}
	<p>
		<span class="loading loading-spinner text-warning"></span>
		getting the target data...
	</p>
{:else if target_data}
	<h4>
		Generated English text ({target_data.audience})
	</h4>
	<p>
		{target_data.text}
	</p>
{/if}
