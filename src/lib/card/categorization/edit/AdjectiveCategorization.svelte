<script lang="ts">
	import SemanticCategorization from './SemanticCategorization.svelte'
	import UsageInfo from './UsageInfo.svelte'

	interface Props {
		categories?: string[]
		part_of_speech?: string
	}

	let { categories = $bindable([]), part_of_speech = 'Adjective' }: Props = $props()
</script>

<SemanticCategorization {part_of_speech} bind:categories={categories} />
<UsageInfo {part_of_speech} bind:categories={categories} offset={1} />
