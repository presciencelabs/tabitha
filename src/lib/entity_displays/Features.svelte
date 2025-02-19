<script>
	/** @type {SourceEntity} */
	export let source_entity
	export let classes = ''

	const { category, category_abbr, feature_codes, features } = source_entity

	const last_feature_to_display = features.findLastIndex(({ name }) => !name.startsWith('Spare'))

	const features_to_display = features.slice(0, last_feature_to_display + 1)
	const feature_codes_to_display = get_feature_codes_to_display()

	function get_feature_codes_to_display() {
		if (category !== 'Clause')
			return feature_codes.slice(0, last_feature_to_display + 1)

		// Collapse meaningless features on clauses
		// C-EDp00NNNNNNNNNNNNN. -> C-EDp00..
		// C-IDp00NNNNNNNNNBNNN. -> C-IDp00..B..
		// starting with index 5, collapse all 'N' and '.' values, leaving any unique values
		const feature_code_chars = [...feature_codes]
		const collapse_start = 5
		const next_meaningful_char = feature_code_chars.findIndex((char, index) => index > collapse_start && !['N', '.'].includes(char))
		const last_meaningful_char = feature_code_chars.findLastIndex(char => !['N', '.'].includes(char))

		return next_meaningful_char === -1
			? `${feature_codes.slice(0, collapse_start)}..`
			: `${feature_codes.slice(0, collapse_start)}..${feature_codes.slice(next_meaningful_char, last_meaningful_char + 1)}..`
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
	<div class="dropdown dropdown-hover dropdown-bottom {classes}">
		<div class="overflow-x-auto dropdown-content z-[1] text-sm p-2 shadow-xl rounded-box w-96 bg-base-200 tracking-normal">
			<ul>
				<li class='font-semibold'>{category}</li>
				{#each features_to_display as feature}
					<li class='{can_be_dulled(feature) ? 'opacity-50' : ''}'>
						<span class='font-semibold'>{feature.name}</span> = {feature.value}
					</li>
				{/each}
			</ul>
		</div>
		<div role="button">
			<span class="text-sm tracking-tight">
				{category_abbr}-{feature_codes_to_display}
			</span>
		</div>
	</div>
{/if}
