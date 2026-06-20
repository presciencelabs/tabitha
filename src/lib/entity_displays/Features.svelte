<script>
	import { is_used_in_source } from '$lib/encoding/features'

	/** @type {{ source_entity: SourceEntity, classes?: string }} */
	let { source_entity, classes='' } = $props()

	let category = source_entity.category
	let features = source_entity.features

	const features_to_display = features.filter(is_used_in_source(category))
	if (source_entity.noun_list_index) {
		// show the noun list index as a feature
		features_to_display.splice(0, 0, { name: 'Noun List Index', value: source_entity.noun_list_index })
	}

	/**
	 * @param {EntityFeature} feature
	 * @returns {boolean}
	 */
	function can_be_dulled({ value }) {
		return value === 'No' || ['Un', 'No ', 'Not '].some(prefix => value.startsWith(prefix))
	}
</script>

{#if features.length}
	<ul class="{classes}">
		<li class='font-semibold'>{category}</li>
		{#each features_to_display as feature}
			<li class='{can_be_dulled(feature) ? 'opacity-50' : ''}'>
				<span class='font-semibold'>{feature.name}</span> = {feature.value}
			</li>
		{/each}
	</ul>
{/if}
