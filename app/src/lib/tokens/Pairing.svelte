<script>
	import Error from './Error.svelte'
	import Loading from './Loading.svelte'
	import Result from './Result.svelte'
	import NotFound from './NotFound.svelte'
	import {check_ontology} from '$lib/lookups'
	import { REGEXES } from '$lib/regexes'

	/** @type {CheckedToken} */
	export let checked_token

	$: [left, right] = split_pair(checked_token.token)

	// scenarios:
	//		good: follower follower/disciple
	//		bad: /disciple follower/ disciple/disciple disciple/follower /
	/**
	 * @param {string} token
	 * @returns {CheckedToken[]}
	 */
	function split_pair(token) {
		return token.split('/').map(token => ({token, message: checked_token.message}))
	}

	/**
	 * @param {CheckedToken} word1
	 * @param {CheckedToken} word2
	 */
	async function lookup(word1, word2) {
		return Promise.all([
			check_ontology(word1),
			check_ontology(word2),
		])
	}
</script>

{#await lookup(left, right)}
	<Loading {checked_token} />
{:then [left_result, right_result]}
	<!-- TODO: consider multiple matches where the levels are different, e.g., son -->
	{@const left_match = left_result.matches?.[0]}
	{@const right_match = right_result.matches?.[0]}

	<div class="join">
		{#if left_match}
			{#if REGEXES.IS_LEVEL_SIMPLE.test(left_match.level) }
				<Result result={left_result} classes='join-item' />
			{:else}
				{@const error = {token: left.token, message: 'Word must be a level 0 or 1'}}

				<Error checked_token={error} classes='join-item' />
			{/if}
		{:else}
			<NotFound {checked_token} classes='join-item' />
		{/if}

		<span class="badge badge-lg badge-outline px-1.5 py-5 text-2xl join-item">
			/
		</span>

		{#if right_match}
			{#if REGEXES.IS_LEVEL_COMPLEX.test(right_match.level) }
				<Result result={right_result} classes='join-item' />
			{:else}
				{@const error = {token: right.token, message: 'Word must be a level 2 or 3'}}

				<Error checked_token={error} classes='join-item' />
			{/if}
		{:else}
			<NotFound {checked_token} classes='join-item' />
		{/if}
	</div>
{:catch}
	<NotFound {checked_token} />
{/await}
