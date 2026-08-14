<script lang="ts">
	import type { Component } from 'svelte'
	import type { PartOfSpeech } from '$lib/types'
	import AdjectiveCategorization from './AdjectiveCategorization.svelte'
	import SemanticCategorization from './SemanticCategorization.svelte'
	import ThetaGrid from './ThetaGrid.svelte'
	import UsageInfo from './UsageInfo.svelte'

	interface Props {
		part_of_speech: PartOfSpeech | string
		categories?: string[]
	}

	let { part_of_speech, categories = $bindable([]) }: Props = $props()

	type CategoryComponent = Component<
		{ part_of_speech: PartOfSpeech | string, categories: string[] },
		Record<string, never>,
		'categories'
	>

	const lookup: Partial<Record<PartOfSpeech, CategoryComponent>> = {
		Adjective: AdjectiveCategorization,
		Adposition: UsageInfo,
		Adverb: UsageInfo,
		Conjunction: UsageInfo,
		Noun: SemanticCategorization,
		Verb: ThetaGrid,
	}

	let CurrentComponent = $derived(lookup[part_of_speech as PartOfSpeech])
</script>

{#if CurrentComponent}
	<CurrentComponent bind:categories {part_of_speech} />
{/if}
