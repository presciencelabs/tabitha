<script>
	import Icon from '@iconify/svelte'
	import {REGEXES} from '$lib'
	import {check_ontology} from '$lib/lookups'
	import {parse} from '$lib/parser'

	let entered_text = ''

	$: checked_tokens = parse(entered_text)
	$: has_error = checked_tokens.some(({message}) => !!message)
	$: success = checked_tokens.length && !has_error
</script>

<form class="grid justify-items-center">
	<!-- svelte-ignore a11y-autofocus -->
	<textarea bind:value={entered_text} rows="5" autofocus class="textarea textarea-bordered textarea-lg w-4/5" />
</form>

<div class="divider my-12" class:divider-success={success} class:divider-error={has_error}>
	<!-- prettier-ignore -->
	<span class:text-success={success} class:text-error={has_error} class="prose text-2xl">
		Phase 1 encoding
	</span>

	{#if success}
		<Icon icon={`mdi:check-circle`} class="h-16 w-16 text-success" />
	{:else if has_error}
		<Icon icon={`mdi:close-circle`} class="h-16 w-16 text-error" />
	{/if}
</div>

<section class="prose flex max-w-none flex-wrap items-center justify-center gap-x-4 gap-y-8">
	{#each checked_tokens as checked_token}
		{@const {message, token} = checked_token}
		{@const has_error = !!message}
		{@const is_punctuation = REGEXES.RELEVANT_PUNCTUATION.test(token)}
		{@const is_sp_notation = token.startsWith('_')}

		{#if has_error}
			<div data-tip={message} class="tooltip tooltip-error">
				<span class="badge badge-error gap-2">
					<Icon icon="mdi:close-circle" class="h-6 w-6" />

					{token}
				</span>
			</div>
		{:else if is_punctuation}
			<span class="pb-3 text-6xl font-thin">
				{token}
			</span>
		{:else if is_sp_notation}
			<span class="font-mono text-lg tracking-widest">
				{token}
			</span>
		{:else}
			{#await check_ontology(checked_token)}
				<span class="badge badge-outline">
					<span class="opacity-30">
						{token}
					</span>
					<!-- used absolute here to avoid any layout shift (centers the pulse as well) -->
					<span class="loading loading-ring loading-lg absolute" />
				</span>
			{:then { matches }}
				<!-- TODO: more work needed to handle multiple matches with possibly different levels, e.g.,  -->
				{@const level_color = matches.length ? `L${matches[0].level}` : ''}

				<span class="badge badge-outline {level_color}">
					{token}
				</span>
			{/await}
		{/if}
	{/each}
</section>

<style lang="postcss">
	/* had to override daisyui's sizing so I could make the line bigger */
	.divider::before,
	.divider::after {
		@apply h-2;
	}

	/* common across all badges */
	span.badge {
		@apply badge-lg px-4 py-5 text-lg tracking-widest;
	}

	/*TODO: second copy of these, time to DRY them out.  Also used in Ontology app.
		level colors in TBTA are as follows:
			0 => blue
			1 => creme
			2 => magenta
			3 => green
			4 => brown
	*/
	.L0 {
		color: whitesmoke;
		background-color: #0b66ff;
		border-color: whitesmoke;
	}
	.L1 {
		color: darkblue;
		background-color: #fcffc5;
		filter: saturate(200%);
		border-color: darkblue;
	}
	.L2 {
		color: yellow;
		background-color: #fb00ff;
		border-color: yellow;
	}
	.L3 {
		color: whitesmoke;
		background-color: #0f7000;
		border-color: whitesmoke;
	}
	.L4 {
		color: whitesmoke;
		background-color: #6b2f30;
		border-color: whitesmoke;
	}
</style>
