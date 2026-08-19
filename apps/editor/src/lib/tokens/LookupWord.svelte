<script lang="ts">
	import type { SimpleToken } from '$lib/types'
	import Pairing from './Pairing.svelte'
	import PronounReferent from './PronounReferent.svelte'
	import SingleToken from './SingleToken.svelte'

	interface Props {
		token: SimpleToken
	}

	let { token }: Props = $props()
</script>

{#if token.pairing}
	<Pairing {token} />
{:else if token.pronoun}
	<PronounReferent {token} />
{:else}
	<SingleToken {token} />
{/if}