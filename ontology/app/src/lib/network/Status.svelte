<script>
	import Icon from '@iconify/svelte'
	import {offline} from '.'

</script>

{#if $offline}
	<span class="badge badge-error badge-lg gap-2">
		<Icon icon="carbon:cloud-offline" /> offline
	</span>
{/if}