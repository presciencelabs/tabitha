<script>
    import Tokens from './Tokens.svelte'

	/** @type {SimpleToken} */
	export let token
</script>

<Tokens tokens={token.sub_tokens} />