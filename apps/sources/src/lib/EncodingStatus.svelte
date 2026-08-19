<script lang="ts">
	import type { SourceStatus } from '@tabitha/types'

	let { status, classes = '' }: { status: SourceStatus, classes?: string } = $props()

	const class_map = new Map<SourceStatus, string>([
		['Ready to Translate', 'status-ready'],
		['Final Review in Progress', 'status-review'],
		['Initial Analysis Complete', 'status-initial-complete'],
		['Initial Analysis in Progress', 'status-in-progress'],
		['Not Started', 'status-not-started'],
	])

	let badge_class = $derived(class_map.get(status) || '')
</script>

<div class="badge {badge_class} {classes}">
	{status}
</div>