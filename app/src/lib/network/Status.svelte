<script>
	import Icon from '@iconify/svelte'
	import {offline} from '.'
</script>

{#if $offline}
	<span class="badge badge-error badge-lg gap-4 tracking-widest">
		<Icon icon="carbon:cloud-offline" /> offline
	</span>
{/if}

<style>
	span {
		width: var(--width, initial);
	}

	/* overrode daisy's class here so this badge was a little more prominent */
	.badge-lg {
		height: 2rem;
	}
</style>
