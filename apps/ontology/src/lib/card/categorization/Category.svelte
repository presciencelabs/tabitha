<script lang="ts">
	import type { Component } from 'svelte'
	import type { PartOfSpeech } from '$lib/types'
	import SemanticCategorization from './SemanticCategorization.svelte'
	import TBD from './TBD.svelte'
	import ThetaGrid from './ThetaGrid.svelte'
	import UsageInfoForAdjective from './UsageInfoForAdjective.svelte'
	import UsageInfoForParticles from './UsageInfoForParticles.svelte'

	type Props = {
		part_of_speech: PartOfSpeech | string
		categories: string[]
	}

	let { part_of_speech, categories }: Props = $props()

	type DisplayComponent = Component<{ categories: string[] }>

	const lookup: Partial<Record<PartOfSpeech, DisplayComponent>> = {
		Adjective: UsageInfoForAdjective,
		Adposition: UsageInfoForParticles,
		Adverb: UsageInfoForParticles,
		Conjunction: UsageInfoForParticles,
		Noun: SemanticCategorization,
		Verb: ThetaGrid,
	}

	let CurrentComponent = $derived(lookup[part_of_speech as PartOfSpeech] || TBD)
</script>

<CurrentComponent {categories} />
