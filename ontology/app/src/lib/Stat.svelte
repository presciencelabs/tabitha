<script>
	/**
	 * @typedef StatInput
	 *
	 * @property {string} 			description
	 * @property {string|number} 	value
	 **/

	/** @type {StatInput[]} */
	export let stats

	/** @type {string} must be a class name */
	export let bgColorClass = $$props['bg-color-class'] || '' // had to use $$props because of https://github.com/sveltejs/svelte/issues/3852
</script>

<!-- https://daisyui.com/components/stat -->
<dl class={`stats w-full ${bgColorClass}`}>
	{#each stats as stat}
		<div class="stat place-items-center">
			<dd class="stat-value">{stat.value}</dd>
			<dt class="stat-desc">{stat.description}</dt>
		</div>
	{/each}
</dl>
