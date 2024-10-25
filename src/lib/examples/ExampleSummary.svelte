<script>
	/** @type { Reference } */
	export let reference

	/** @type { ContextArguments } */
	export let context

	$: ({ id_primary, id_secondary, id_tertiary } = reference)
</script>

<section class="flex">
	<span class="min-w-1/6 w-1/6 flex-shrink-0 whitespace-nowrap">
		{id_primary} {id_secondary}:{id_tertiary}
	</span>

	<aside class="flex flex-wrap gap-y-2">
		{#each Object.entries(context) as [key, value]}
			<span class="badge badge-info p-4 badge-outline ml-2">
				<em>{key}: </em>
				<strong class="ml-2 text-info font font-semibold">{value}</strong>
			</span>
		{/each}
	</aside>
</section>
