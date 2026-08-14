<script>
	import { PUBLIC_TARGETS_API_HOST } from '$env/static/public'

	/** @type {Reference} */
	export let reference

	/**
	 * @param {Reference} reference
	 *
	 * @returns {Promise<TargetTextResult>}
	 */
	async function get_target_data({ id_primary, id_secondary, id_tertiary }) {
		const response = await fetch(`${PUBLIC_TARGETS_API_HOST}/English/${id_primary}/${id_secondary}/${id_tertiary}`)

		// Show the Unchurched Adults if available, because it's usually the most up-to-date.
		// Otherwise, default to the first audience with text
		/** @type {TargetTextResult[]}*/
		const texts = await response.json()
		return texts.find(text => text.audience === 'Unchurched Adults')
			|| texts.find(text => text.text)
			|| { text: '--', audience: 'none saved yet...' }
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
