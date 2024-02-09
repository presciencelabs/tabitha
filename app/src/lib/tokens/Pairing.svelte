<script>
	import Error from './Error.svelte'
	import Loading from './Loading.svelte'
	import NotFound from './NotFound.svelte'
	import Result from './Result.svelte'
	import TokenDisplay from './TokenDisplay.svelte'
	import {check_ontology} from '$lib/lookups'
	import {REGEXES} from '$lib/regexes'

	/** @type {Token} */
	export let token

	// At this point the pairing tokens will never be null
	/** @type {Token} */
	// @ts-ignore
	$: left_token = token.pairing_left

	/** @type {Token} */
	// @ts-ignore
	$: right_token = token.pairing_right

	/**
	 *
	 * @param {Token} left
	 * @param {Token} right
	 */
	async function lookup(left, right) {
		return Promise.all([
			check_ontology(left),
			check_ontology(right)
		])
	}
</script>

{#await lookup(left_token, right_token)}
	<Loading {token} />
{:then [left_result, right_result]}
	<!--
		scenarios:
			good: follower follower/disciple
			bad: /disciple follower/ disciple/disciple disciple/follower /
	-->

	<!-- TODO: consider multiple matches where the levels are different, e.g., son -->
	{@const left_match = left_result.matches?.[0]}
	{@const right_match = right_result.matches?.[0]}

	<div class="join">
		{#if left_match}
			{#if REGEXES.IS_LEVEL_SIMPLE.test(`${left_match.level}`)}
				<Result token={left_token} result={left_result} classes="join-item" />
			{:else}
				{@const error = {...left_token, message: 'Word must be a level 0 or 1'}}

				<Error token={error} classes="join-item" />
			{/if}
		{:else}
			<NotFound token={left_token} classes="join-item" />
		{/if}

		<TokenDisplay classes="!px-1.5 [font-family:cursive] join-item">/</TokenDisplay>

		{#if right_match}
			{#if REGEXES.IS_LEVEL_COMPLEX.test(`${right_match.level}`)}
				<Result token={right_token} result={right_result} classes="join-item" />
			{:else}
				{@const error = {...right_token, message: 'Word must be a level 2 or 3'}}

				<Error token={error} classes="join-item" />
			{/if}
		{:else}
			<NotFound token={right_token} classes="join-item" />
		{/if}
	</div>
{:catch}
	<NotFound {token} />
{/await}
