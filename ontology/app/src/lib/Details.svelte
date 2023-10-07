<script>
	/** @type {string} must be a class name */
	export let bgColorClass = $$props['bg-color-class'] || '' // had to use $$props because of https://github.com/sveltejs/svelte/issues/3852
</script>

<details class={`collapse collapse-arrow ${bgColorClass}`}>
	<summary class="collapse-title">
		<slot name="summary" />
	</summary>

	<p class="collapse-content">
		<slot />
	</p>
</details>
