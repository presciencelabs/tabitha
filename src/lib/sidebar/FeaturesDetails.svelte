<script>
	import { is_used_in_source } from '$lib/encoding/features'

	/** @type {{ data: PageSourceEntity }} */
	const { data } = $props()

	let filtered_features = $derived(data.features.filter(is_used_in_source(data.category)))

	/**
	 * @param {EntityFeature} feature
	 * @returns {boolean}
	 */
	function can_be_dulled({ value }) {
		return value === 'No' || ['Un', 'No ', 'Not '].some(prefix => value.startsWith(prefix))
	}
</script>

{#if filtered_features.length === 0}
	<p>No features to show.</p>
{:else}
	<table class="table table-sm table-zebra">
		<tbody>
			{#each filtered_features as feature}
				<tr class='{can_be_dulled(feature) ? 'opacity-50' : ''}'>
					<td>{feature.name}</td>
					<td>{feature.value}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
