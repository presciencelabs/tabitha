<script>
	/** @type {{ source_entity: PageSourceEntity, classes?: string }} */
	let { source_entity, classes='' } = $props()
</script>

<span class="px-1 -mt-4 text-6xl font-thin {classes}">
	{source_entity.value}
</span>
