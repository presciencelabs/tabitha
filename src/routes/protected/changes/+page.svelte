<script lang="ts">
	import type { PageProps } from './$types'
	import Icon from '@iconify/svelte'

	let { data }: PageProps = $props()

	let changes = $derived(data.changes)

	function categories_display(value: string[], old: string[] | undefined) {
		if (!old) {
			return value.filter(v => !!v && !v.startsWith('never')).join(' | ')
		}

		const display_parts: string[] = []
		for (let i = 0; i < value.length; i++) {
			if (value[i] !== old[i]) {
				display_parts.push(`'${old[i]}' → '${value[i]}'`)
			}
		}
		return display_parts.join(' | ')
	}
	
	let applying_changes = $state(false)
	let status_message = $state('')
	let status_type: 'idle' | 'success' | 'error' = $state('idle')

	async function trigger_apply_changes() {
		applying_changes = true
		status_message = 'Applying pending changes...'
		status_type = 'idle'

		try {
			const res = await fetch('/protected/changes/apply-pending', { method: 'POST' })
			const result = await res.json()

			if (res.ok && result.success) {
				const time = new Date(result.timestamp).toLocaleTimeString()

				const success_message = `Successfully applied ${result.count} changes at ${time} for new Ontology Version ${result.version}.`
				const failed_message = result.failed > 0 ? `Failed to apply ${result.failed} changes.` : ''
				status_message = `${success_message} ${failed_message}`
				status_type = result.failed === 0 ? 'success' : 'error'
			} else {
				status_message = result.message || result.error || 'Failed to apply complex terms.'
				status_type = 'error'
			}
		} catch (err: unknown) {
			status_message = err instanceof Error ? err.message : 'An error occurred during apply.'
			status_type = 'error'
		} finally {
			applying_changes = false
		}
	}
</script>

<div class="pt-5 w-full">
	<div class="prose">
		<h3>Changes</h3>
	</div>

	{#if changes.some(change => change.approved_by && !change.applied_date)}
		<div class="py-4">
			<button onclick={trigger_apply_changes} disabled={applying_changes} class="btn btn-primary">
				{#if applying_changes}
					<span class="loading loading-spinner loading-xs"></span>
					Applying changes...
				{:else}
					<Icon icon="material-symbols:published-with-changes" class="w-4 h-4" />
					Apply pending changes now
				{/if}
			</button>

			{#if status_message}
				<div class="alert mt-4 text-sm {status_type === 'success' ? 'alert-success' : status_type === 'error' ? 'alert-error' : 'alert-info'}">
					{#if status_type === 'success'}
						<Icon icon="material-symbols:check-circle-outline" class="w-5 h-5" />
					{:else if status_type === 'error'}
						<Icon icon="material-symbols:error-outline" class="w-5 h-5" />
					{:else}
						<Icon icon="material-symbols:info-outline" class="w-5 h-5" />
					{/if}
					<span>{status_message}</span>
				</div>
			{/if}
		</div>
	{/if}

	{#if changes.length > 0}
		<table class="table w-full">
			<thead>
				<tr>
					<th>Action</th>
					<th>Concept</th>
					<th>Change</th>
					<th>Approved</th>
					<th>Applied</th>
					<th>Version</th>
				</tr>
			</thead>
			<tbody>
			{#each changes as change}
				<tr>
					<td>{change.action === 'create' ? 'Add' : 'Edit'}</td>
					<td>{change.concept.stem}-{change.concept.sense} ({change.concept.part_of_speech})</td>
					<td>
						<ul class="list list-disc">
							{#if change.data.level}
								{@const { value, old } = change.data.level}
								<li><span class="font-semibold">Level</span>: {old ? `${old} → ${value}` : value}</li>
							{/if}
							{#if change.data.gloss}
								{@const { value, old } = change.data.gloss}
								<li><span class="font-semibold">Gloss</span>: {old !== undefined ? `'${old}' → '${value}'` : value}</li>
							{/if}
							{#if change.data.brief_gloss}
								{@const { value, old } = change.data.brief_gloss}
								<li><span class="font-semibold">Brief gloss</span>: {old !== undefined ? `'${old}' → '${value}'` : value}</li>
							{/if}
							{#if change.data.categories}
								{@const { value, old } = change.data.categories}
								{@const label = change.concept.part_of_speech === 'Verb' ? 'Theta grid' : 'Categorization'}
								<li><span class="font-semibold">{label}</span>: {categories_display(value, old)}</li>
							{/if}
							{#if change.data.curated_examples}
								<li><span class="font-semibold">Curated examples</span> updated</li>
							{/if}
						</ul>
					</td>
					<td>
						{#if change.approved_by}
							{change.approved_by.date.toLocaleString()}
							<!--TODO Show the user name instead, and don't show unless they're authenticated-->
							({change.approved_by.email})
						{/if}
					</td>
					<td>
						{change.applied_date ? change.applied_date.toLocaleString() : 'Pending'}
					</td>
					<td>
						{change.version || ''}
					</td>
				</tr>
			{/each}
			</tbody>
		</table>
	{:else}
		No changes to show yet.
	{/if}
</div>