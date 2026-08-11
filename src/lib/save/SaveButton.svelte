<script>
	import Icon from '@iconify/svelte'
	import { saved } from '.'

	/** @type {{ content: string, classes?: string }} */
	let { content, classes = '' } = $props()

	let is_saved = $derived(content !== '' && $saved === content)

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
	<button onclick={ save } class="btn btn-warning {classes}">
		Save to this browser

		<Icon icon="mdi:content-save" class="h-6 w-6" />
	</button>
{/if}