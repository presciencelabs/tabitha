<script>
	import Icon from '@iconify/svelte'
	import { saved } from '.'

	/** @type {string} content */
	export let content
	export let classes = ''

	$: is_saved = content !== '' && $saved === content

	function save() {
		$saved = content
	}
</script>

{#if is_saved}
	<button class="btn btn-success {classes}" class:btn-warning={!is_saved}>
		Saved in this browser

		<Icon icon="mdi:content-save-check" class="h-6 w-6" />
	</button>
{:else}
	<button on:click={ save } class="btn btn-warning {classes}">
		Save to this browser

		<Icon icon="mdi:content-save" class="h-6 w-6" />
	</button>
{/if}
<!-- <button on:click={ save } class="btn btn-secondary {classes}" class:btn-success={is_saved} class:btn-warning={!is_saved}>
	Save to this browser

	<Icon icon={ is_saved ? 'mdi:content-save-check' : 'mdi:content-save' } class="h-6 w-6" />
</button>
<button on:click={ save } class="btn btn-secondary {classes}" class:btn-success={is_saved} class:btn-warning={!is_saved}>
	Save to this browser

	<Icon icon={ is_saved ? 'mdi:content-save-check' : 'mdi:content-save' } class="h-6 w-6" />
</button> -->