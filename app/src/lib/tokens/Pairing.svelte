<script>
	import TokenDisplay from './TokenDisplay.svelte'
	import Word from './Word.svelte'

	/** @type {Token} */
	export let token

	/**
	 * scenarios:
	 * good: follower follower/disciple
	 * bad: /disciple follower/ disciple/disciple disciple/follower /
	 */

	$: [left_token, right_token] = token.sub_tokens
</script>

<div class="join">
	<Word token={left_token} classes="join-item" />

	<TokenDisplay classes="!px-1.5 [font-family:cursive] join-item">/</TokenDisplay>

	<Word token={right_token} classes="join-item" />
</div>
