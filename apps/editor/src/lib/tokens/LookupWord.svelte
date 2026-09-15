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
	<div class="join">
		<PronounReferent {token} />
	</div>
{:else if token.pairing}
	<div class="join">
		<Pairing {token} />
	</div>
{:else}
	<SingleToken {token} />
{/if}