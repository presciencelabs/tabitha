<script>
	import Icon from '@iconify/svelte'
	import { offline } from '.'
	import { Badge } from '$lib'
</script>

{#if $offline}
	<Badge classes="badge-xl badge-error gap-4 tracking-widest">
		<Icon icon="carbon:cloud-offline" /> offline
	</Badge>
{/if}
