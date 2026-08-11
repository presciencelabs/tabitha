<script>
    import Tokens from './Tokens.svelte'

	/** @type {{ token: SimpleToken }}*/
	let { token } = $props()
</script>

<Tokens tokens={token.sub_tokens} />