<script>
	import TokenDisplay from './TokenDisplay.svelte'
	import Icon from '@iconify/svelte'

	/** @type {Token} */
	export let token

	export let classes = ''
</script>

<div data-tip={token.message} class="tooltip tooltip-error">
	<TokenDisplay classes="badge-error gap-2 {classes}">
		<Icon icon="mdi:close-circle" class="h-6 w-6" />

		{token.token}
	</TokenDisplay>
</div>
