<script>
	import TokenDisplay from './TokenDisplay.svelte'
	import Word from './Word.svelte'
	import Error from './Error.svelte'

	/** @type {Token} */
	export let token

	/** @type {Token} */
	// @ts-ignore the pronoun will always be non-null at this point
	const pronoun = token.pronoun
</script>

<div class="join">
	{#if pronoun.message}
		<Error token={pronoun} classes="!px-1.5 join-item" />
	{:else}
		<TokenDisplay classes="!px-2 join-item">
			{pronoun.token}
		</TokenDisplay>
	{/if}

	<TokenDisplay classes="!px-1.5 [font-family:cursive] join-item">(</TokenDisplay>

	<Word {token} classes="join-item" />

	<TokenDisplay classes="!px-1.5 [font-family:cursive] join-item">)</TokenDisplay>
</div>
