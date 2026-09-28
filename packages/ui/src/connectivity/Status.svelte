<script lang="ts">
	import Icon from '@iconify/svelte'
	import { network_state } from './network.svelte'
	import { get_ui_messages } from '../i18n/ui_messages'

	const messages = get_ui_messages()
</script>

{#if network_state.is_offline}
	<span class="badge badge-error badge-lg gap-4 tracking-widest">
		<Icon icon="carbon:cloud-offline" /> {messages.ui_offline()}
	</span>
{/if}
