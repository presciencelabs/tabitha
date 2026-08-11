<script lang="ts">
    import Message from './Message.svelte'
	import TokenDisplay from './TokenDisplay.svelte'
	import Word from './Word.svelte'

	let { token }: { token: SimpleToken } = $props()

	/**
	 * scenarios:
	 * good: follower follower/disciple
	 * bad: /disciple follower/ disciple/disciple disciple/follower /
	 */

	let pairing_token = $derived(token.pairing!)	// the pairing will always be non-null at this point
</script>

<div class="join">
	<Message {token} />
	<Word {token} classes="join-item" />

	<TokenDisplay classes="!px-1.5 [font-family:cursive] join-item">{token.pairing_type === 'complex' ? '/' : '|'}</TokenDisplay>

	<Message token={pairing_token} />
	<Word token={pairing_token} classes="join-item" />
</div>
