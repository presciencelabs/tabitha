<script lang="ts">
	import { PUBLIC_TARGETS_API_HOST } from '$env/static/public'
	import type { Reference, TargetTextResult } from '$lib/types'

	interface Props {
		reference: Reference
	}

	let { reference }: Props = $props()

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
</script>

{#await get_target_data(reference)}
	<p>
		<span class="loading loading-spinner text-warning"></span>
		getting the target data...
	</p>
{:then { text, audience }}
	<h4>
		Generated English text ({audience})
	</h4>
	<p>
		{text}
	</p>
{/await}
