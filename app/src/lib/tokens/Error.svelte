<script>
	import Token from './Token.svelte'
	import Icon from '@iconify/svelte'

	/** @type {CheckedToken} */
	export let checked_token

	export let classes = ''
</script>

<div data-tip={checked_token.message} class="tooltip tooltip-error">
	<Token classes="badge-error gap-2 {classes}">
		<Icon icon="mdi:close-circle" class="h-6 w-6" />

		{checked_token.token}
	</Token>
</div>
