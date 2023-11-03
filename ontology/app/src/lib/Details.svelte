<script>
	/** @type {string} class(es) separated by space */
	export let colors = ''
</script>

<details class={`collapse collapse-arrow ${colors}`}>
	<summary class="collapse-title">
		<slot name="summary" />
	</summary>

	<p class="collapse-content">
		<slot />
	</p>
</details>
