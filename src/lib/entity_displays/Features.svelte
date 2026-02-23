<script>
	/** @type {SourceEntity} */
	export let source_entity
	export let classes = ''

	const { category, features } = source_entity

	const last_feature_to_display = features.findLastIndex(({ name }) => !name.startsWith('Spare'))
	const features_to_display = features.slice(0, last_feature_to_display + 1)
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
