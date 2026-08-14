<script>
	import Icon from '@iconify/svelte'

	/** @type { Reference } */
	export let reference

	/** @type { ContextArguments } */
	export let context

	/** @type { SourceStatus } */
	export let book_status

	$: ({ id_primary, id_secondary, id_tertiary } = reference)
</script>

<section class="flex">
	<span class="min-w-1/6 w-1/6 flex-shrink-0 whitespace-nowrap">
		{id_primary} {id_secondary}:{id_tertiary}

		{#if book_status !== 'Ready to Translate'}
			<div class="dropdown dropdown-hover">
				<div role="button" class="-mb-1 text-warning">
					<Icon icon="mdi:alert-outline" class="h-5 w-5" />
				</div>
				<div class="dropdown-content bg-warning text-warning-content text-sm rounded-box z-1 p-2 shadow-sm">
					Source data for this book is still being reviewed, so this usage may not be accurate.
				</div>
			</div>
		{/if}
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
