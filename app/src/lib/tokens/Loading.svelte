<script>
	/** @type {CheckedToken} */
	export let checked_token
</script>

<span class="badge badge-outline">
	<span class="opacity-30">
		{checked_token.token}
	</span>

	<!-- used absolute here to avoid any layout shift (centers the pulse as well) -->
	<span class="loading loading-ring loading-lg absolute" />
</span>
