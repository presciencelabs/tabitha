<script>
	/** @type {SourceEntity} */
	export let source_entity
	
	/** @type {Record<string, string>}*/
	const boundary_size_map = {
		'}': 'text-2xl',
		']': 'text-xl',
		')': 'text-xl',
	}
</script>

<span class="{boundary_size_map[source_entity.value]} font-thin pe-1">
	{']'}
</span>
