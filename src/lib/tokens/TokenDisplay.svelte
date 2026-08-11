<script>
	import { Badge } from '$lib'

	/** @type {{ children: import('svelte').Snippet, classes?: string }}*/
	let { children, classes = '' } = $props()
</script>

<Badge classes="badge-outline px-4 py-5 text-lg tracking-widest {classes}" {children} />
