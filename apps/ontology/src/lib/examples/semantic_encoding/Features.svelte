<script>
	/** @type {SourceEntity} */
	export let source_entity
	export let classes = ''

	const { category, features } = source_entity

	const features_to_display = features.filter(get_features_to_display)

	/**
	 * @param {EntityFeature} feature
	 * @returns {boolean}
	 */
	function get_features_to_display({ value }) {
		return !(value === 'No' || ['Un', 'No ', 'Not '].some(prefix => value.startsWith(prefix)))
	}
</script>

{#if features.length}
	<div class="dropdown dropdown-hover dropdown-bottom {classes}">
		<div class="dropdown-content text-sm text-nowrap shadow-xl rounded-box bg-info text-info-content tracking-normal">
			<ul class='list-none not-prose p-2'>
				<li class='font-semibold'>{category}</li>
				{#each features_to_display as feature}
					<li>
						<span class='font-semibold'>{feature.name}</span> = {feature.value}
					</li>
				{/each}
			</ul>
		</div>
		<div role="button">
			<slot />
		</div>
	</div>
{/if}
