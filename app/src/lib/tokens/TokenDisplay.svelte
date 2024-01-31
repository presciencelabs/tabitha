<script>
	import {Badge} from '$lib'

	export let classes = ''
</script>

<Badge classes="badge-outline px-4 py-5 text-lg tracking-widest {classes}">
	<slot />
</Badge>
