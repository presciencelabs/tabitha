<script lang="ts">
	import Icon from '@iconify/svelte'
	import { network_state } from './network.svelte'
</script>

{#if network_state.is_offline}
	<span class="badge badge-error badge-lg gap-4 tracking-widest">
		<Icon icon="carbon:cloud-offline" /> offline
	</span>
{/if}
