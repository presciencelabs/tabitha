<script>
	import Icon from '@iconify/svelte'

	/** @type {CheckedToken} */
	export let checked_token

	export let classes = ''
</script>

<div data-tip={checked_token.message} class="tooltip tooltip-error">
	<span class="badge badge-lg badge-error px-4 py-5 text-lg tracking-widest gap-2 {classes}">
		<Icon icon="mdi:close-circle" class="h-6 w-6" />

		{checked_token.token}
	</span>
</div>
