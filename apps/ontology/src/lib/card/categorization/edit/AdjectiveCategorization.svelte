<script>
	import SemanticCategorization from './SemanticCategorization.svelte'
	import UsageInfo from './UsageInfo.svelte'

	/** @type {{ categories: string[] }} */
	let { categories = $bindable() } = $props()
</script>

<SemanticCategorization part_of_speech={'Adjective'} bind:categories={categories} />
<UsageInfo part_of_speech={'Adjective'} bind:categories={categories} offset={1} />
