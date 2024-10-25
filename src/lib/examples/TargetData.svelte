<script>
	import { PUBLIC_TARGETS_API_HOST } from '$env/static/public'

	/** @type {Reference} */
	export let reference

	/**
	 * @param {Reference} reference
	 *
	 * @returns {Promise<string>}
	 */
	async function get_target_data({ id_primary, id_secondary, id_tertiary }) {
		const response = await fetch(`${PUBLIC_TARGETS_API_HOST}/English/${id_primary}/${id_secondary}/${id_tertiary}`)

		return await response.json()
	}
</script>

{#await get_target_data(reference)}
	<span class="loading loading-spinner text-warning" />
	getting the target data...
{:then text}
	{text || '–'}
{/await}
