<script>
	let { children, classes = '' } = $props()
</script>

<span class="badge badge-lg border-base-content {classes}">
	{@render children()}
</span>
