<script lang="ts">
	import type { CheckerToken } from '@tabitha/types'
	import Pairing from './Pairing.svelte'
	import PronounReferent from './PronounReferent.svelte'
	import SingleToken from './SingleToken.svelte'

	type Props = {
		token: CheckerToken
	}

	let { token }: Props = $props()
</script>

{#if token.pronoun}
	<PronounReferent {token} />
{:else if token.pairing}
	<Pairing {token} />
{:else}
	<SingleToken {token} />
{/if}