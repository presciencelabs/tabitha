<script>
	/**
	 * @typedef StatInput
	 *
	 * @property {string} 			description
	 * @property {string|number} 	value
	 **/

	/** @type {StatInput[]} */
	export let stats

	/** @type {string} class(es) separated by space */
	export let colors = ''
</script>
<!-- TODO: export these color-classes ☝️ -->

<!-- https://daisyui.com/components/stat -->
<dl class={`stats w-full ${colors}`}>
	{#each stats as stat}
		<div class="stat place-items-center">
			<dd class="stat-value">{stat.value}</dd>
			<dt class="stat-desc">{stat.description}</dt>
		</div>
	{/each}
</dl>
