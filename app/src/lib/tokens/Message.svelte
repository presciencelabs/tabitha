<script>
	import {Badge} from '$lib'
	import Icon from '@iconify/svelte'

	/** @type {Token} */
	export let token
</script>

{#if token.error_message}
	<div data-tip={token.error_message} class="tooltip tooltip-error">
		<Badge classes="badge-outline badge-error px-2 py-5 gap-2 join-item">
			<Icon icon="mdi:close-circle" class="h-6 w-6" />
			<slot />
		</Badge>
	</div>
{:else if token.suggest_message}
	<div data-tip={token.suggest_message} class="tooltip tooltip-warning">
		<Badge classes="badge-outline badge-warning px-2 py-5 gap-2 join-item">
			<Icon icon="mdi:lightbulb" class="h-6 w-6" />
			<slot />
		</Badge>
	</div>
{/if}
