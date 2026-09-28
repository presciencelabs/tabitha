<script lang="ts">
	import type { SourceStatus } from '@tabitha/types'

	let { status, classes = '' }: { status: SourceStatus, classes?: string } = $props()

	const BADGE_CLASS_BY_STATUS: Record<SourceStatus, string> = {
		'Ready to Translate': 'badge-success',
		'Final Review in Progress': 'badge-info',
		'Initial Analysis Complete': 'badge-accent',
		'Initial Analysis in Progress': 'badge-warning',
		'Not Started': 'badge-neutral',
		'Unknown': 'badge-ghost',
	}

	let badge_class = $derived(BADGE_CLASS_BY_STATUS[status])
</script>

<div class="badge {badge_class} {classes}">
	{status}
</div>
