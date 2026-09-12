<script lang="ts">
	import type { CheckerToken } from '@tabitha/types'
	import Tokens from './Tokens.svelte'

	type Props = {
		token: CheckerToken
	}

	let { token }: Props = $props()
</script>

<Tokens tokens={token.sub_tokens} />