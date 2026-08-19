<script lang="ts">
	import type { SimpleToken } from '@tabitha/types'
	import Tokens from './Tokens.svelte'

	type Props = {
		token: SimpleToken
	}

	let { token }: Props = $props()
</script>

<Tokens tokens={token.sub_tokens} />