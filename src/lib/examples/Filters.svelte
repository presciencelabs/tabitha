<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity'
	import { fade } from 'svelte/transition'
	import { derive_filters } from '.'
	import type { Concept, ContextArgumentName, Example, FilterMap, Option } from '$lib/types'

	interface Props {
		concept: Concept
		examples: Example[]
		ondatafiltered?: (filtered_examples: Example[]) => void
	}

	let { concept, examples, ondatafiltered }: Props = $props()

	const FADE_CHARACTERISTICS = {
		delay: 100,
		duration: 700,
	}

	let filters: FilterMap = $derived(derive_filters(concept, examples))
	let selected_filters = new SvelteMap<ContextArgumentName, Option>()

	let filtered_examples = $derived(apply_filters(examples, selected_filters))

	$effect(() => {
		ondatafiltered?.(filtered_examples)
	})

	function apply_filters(examples_list: Example[] = [], filter_rules: Map<ContextArgumentName, Option>): Example[] {
		return examples_list.filter(is_a_match)

		function is_a_match(example: Example): boolean {
			for (const [name, option] of filter_rules.entries()) {
				if (option === 'Any') continue
				if (example.context[name] === option) continue
				if (example.reference.id_primary === option) continue
				if (option === 'Present' && example.context[name]) continue
				if (option === 'Not present' && !example.context[name]) continue
				return false
			}
			return true
		}
	}
</script>

<section class="flex flex-col">
	<form class="flex gap-4 bg-info text-info-content px-4 pt-2 pb-3.5 overflow-x-auto rounded-box">
		{#each filters as [name, options]}
			{@const first_option = [...options][0] ?? 'Any'}
			<fieldset class="fieldset">
				<legend class="fieldset-legend text-info-content">{name}</legend>

				<select
					value={selected_filters.get(name) ?? first_option}
					onchange={e => selected_filters.set(name, e.currentTarget.value)}
					class="select text-base-content"
				>
					{#each [...options] as option}
						<option value={option}>{option}</option>
					{/each}
				</select>
			</fieldset>
		{/each}
	</form>

	{#if filtered_examples.length > 0 && filtered_examples.length < examples.length}
		<aside transition:fade={FADE_CHARACTERISTICS} class="alert alert-info mt-2">
			<span>
				Matched
				<span class="font-mono">{filtered_examples.length}</span>
				{filtered_examples.length === 1 ? 'example' : 'examples'}
			</span>
		</aside>
	{/if}
</section>
