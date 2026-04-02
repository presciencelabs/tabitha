<script>
	import Icon from '@iconify/svelte'
	let { data } = $props()
</script>

<section class="mb-5">
	Welcome to the Ontology Management page. More features coming soon!
</section>

{#if data.can_add}
	<section>
		<a class="btn" href="/protected/concept/create">
			<Icon icon="material-symbols:add" class="w-5 h-5" />
			Add Concept
		</a>
	</section>
{/if}