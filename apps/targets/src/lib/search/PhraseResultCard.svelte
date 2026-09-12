<script lang="ts">
	import { fade } from 'svelte/transition'
	import { SourceData } from '$lib'
	import type { PhraseSearchHit } from '$lib/types'

	type Props = {
		hit: PhraseSearchHit
		search_regex: RegExp
		open?: boolean
	}

	let { hit, search_regex, open = $bindable() }: Props = $props()

	const FADE_CHARACTERISTICS = {
		delay: 100,
		duration: 700,
	}

	let is_open = $derived(Boolean(open))
	let { id_primary, id_secondary, id_tertiary } = $derived(hit.reference)

	function toggle(e: MouseEvent) {
		e.preventDefault()

		// nothing to expand into when Sources has no encoding for this verse yet
		if (!hit.has_encoding) {
			return
		}

		open = !is_open
	}
</script>

<details transition:fade={FADE_CHARACTERISTICS} open={is_open} class="collapse bg-base-100 overflow-visible" class:collapse-arrow={hit.has_encoding}>
	<summary
		onclick={toggle}
		class="collapse-title border border-base-200"
		class:hover:bg-base-200={hit.has_encoding}
		class:cursor-default={!hit.has_encoding}
	>
		<section class="flex gap-2">
			<span class="min-w-1/8 w-1/8 shrink-0 whitespace-nowrap font-semibold">
				{id_primary} {id_secondary}:{id_tertiary}
			</span>

			<aside class="not-prose flex-1">
				<p class="mb-1">
					{#each hit.text.split(search_regex) as fragment, idx}
						{#if idx % 2 === 0}
							{fragment}
						{:else}
							<span class="font-semibold italic">{fragment}</span>
						{/if}
					{/each}
				</p>

				{#if !hit.has_encoding}
					<em class="badge badge-ghost badge-sm">not yet encoded</em>
				{/if}
			</aside>
		</section>
	</summary>

	<section class="collapse-content flex">
		{#if is_open}
			<div class="min-w-1/8 w-1/8"></div>
			<div class="w-7/8">
				<SourceData reference={hit.reference} />
			</div>
		{/if}
	</section>
</details>
