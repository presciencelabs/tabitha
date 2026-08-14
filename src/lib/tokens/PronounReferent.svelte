<script lang="ts">
	import Message from './Message.svelte'
	import TokenDisplay from './TokenDisplay.svelte'
	import Word from './Word.svelte'

	interface Props {
		token: SimpleToken
	}

	let { token }: Props = $props()

	let pronoun = $derived(token.pronoun!)	// the pronoun will always be non-null at this point
</script>

<div class="join">
	<Message token={pronoun} />
	<TokenDisplay classes="!px-2 join-item">{pronoun.token}</TokenDisplay>

	<TokenDisplay classes="!px-1.5 [font-family:cursive] join-item">(</TokenDisplay>

	<Message {token} />
	<Word {token} classes="join-item" />

	<TokenDisplay classes="!px-1.5 [font-family:cursive] join-item">)</TokenDisplay>
</div>
