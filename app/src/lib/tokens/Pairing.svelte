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

	/** @type {Token} */
	// @ts-ignore the pairing will always be non-null at this point
	$: pairing_token = token.complex_pairing
</script>

<div class="join">
	<Word {token} classes="join-item" />

	<TokenDisplay classes="!px-1.5 [font-family:cursive] join-item">/</TokenDisplay>

	<Word token={pairing_token} classes="join-item" />
</div>
