<script>
	import Pairing from './Pairing.svelte'
	import PronounReferent from './PronounReferent.svelte'
	import SingleToken from './SingleToken.svelte'

	/** @type {SimpleToken} */
	export let token
</script>

{#if token.complex_pairing}
	<Pairing {token} />
{:else if token.pronoun}
	<PronounReferent {token} />
{:else}
	<SingleToken {token} />
{/if}