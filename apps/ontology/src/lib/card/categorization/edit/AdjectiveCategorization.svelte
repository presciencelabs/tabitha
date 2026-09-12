<script lang="ts">
	import SemanticCategorization from './SemanticCategorization.svelte'
	import UsageInfo from './UsageInfo.svelte'
	import type { PartOfSpeech } from '@tabitha/types'

	type Props = {
		categories?: string[]
		part_of_speech?: PartOfSpeech
	}

	let { categories = $bindable([]), part_of_speech = 'Adjective' }: Props = $props()
</script>

<SemanticCategorization {part_of_speech} bind:categories={categories} />
<UsageInfo {part_of_speech} bind:categories={categories} offset={1} />
