<script>
	/**
	 * @typedef StatInput
	 *
	 * @property {string} 			description
	 * @property {string|number} 	value
	 **/

	/** @type {StatInput[]} */
	export let stats
</script>

<!-- https://daisyui.com/components/stat -->
<dl class="stats bg-base-200">
	{#each stats as stat}
		<div class="stat place-items-center">
			<dd class="stat-value">{stat.value}</dd>
			<dt class="stat-desc">{stat.description}</dt>
		</div>
	{/each}
</dl>
