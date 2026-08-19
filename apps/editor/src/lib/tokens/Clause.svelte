<script lang="ts">
	import type { SimpleToken } from '$lib/types'
	import Tokens from './Tokens.svelte'

	interface Props {
		token: SimpleToken
	}

	let { token }: Props = $props()
</script>

<Tokens tokens={token.sub_tokens} />