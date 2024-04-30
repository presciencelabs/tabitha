<script>
	import Icon from '@iconify/svelte'

	/** @type {string} content */
	export let content

	export let classes = ''

	let copied = ''
	async function copy() {
		// https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText
		await navigator.clipboard.writeText(content)

		copied = content
	}
</script>

<button on:click={ copy } class="btn btn-secondary {classes}">
	<slot>Copy to clipboard</slot>

	<Icon icon={ content !== '' && copied === content ? 'mdi:check' : 'mdi:content-copy' } class="h-6 w-6" />
</button>
