<script lang="ts">
	import type { PageProps } from './$types'
	import Icon from '@iconify/svelte'
	import { check_for_pending_creates } from '$lib/offline/pending'
	import { apply_pending_changes, approve_change } from '$lib/changes'
	import { format_datetime, format_time } from '$lib/format'
	import type { OntologyChange } from '$lib/types'

	let { data }: PageProps = $props()

	// svelte-ignore state_referenced_locally
	let changes = $state<OntologyChange[]>(data.changes)

	$effect(() => {
		// these only live in this browser's offline queue, so the server can't have included them in data.changes
		check_for_pending_creates().then(local => changes = [...local, ...data.changes])
	})

	function categories_display({ value, old }: { value: string[], old: string[] | undefined }) {
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

	let approving_id = $state<number | null>(null)

	async function approve(change: OntologyChange) {
		approving_id = change.id
		status_message = ''

		try {
			const updated = await approve_change(change.id)
			changes = changes.map(c => c.id === change.id ? updated : c)
		} catch (err: unknown) {
			status_message = err instanceof Error ? err.message : 'An error occurred while approving.'
			status_type = 'error'
		} finally {
			approving_id = null
		}
	}

	async function trigger_apply_changes() {
		applying_changes = true
		status_message = 'Applying pending changes...'
		status_type = 'idle'

		try {
			const { count, failed, version, timestamp, changes: updated } = await apply_pending_changes()
			changes = changes.map(c => updated.find(u => u.id === c.id) ?? c)

			const time = format_time({ date: timestamp, ...data })
			const success_message = `Successfully applied ${count} changes at ${time} for new Ontology Version ${version}.`
			const failed_message = failed > 0 ? `Failed to apply ${failed} changes.` : ''
			status_message = `${success_message} ${failed_message}`
			status_type = failed === 0 ? 'success' : 'error'
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
		</div>
	{/if}

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

	{#if changes.length > 0}
		<table class="table w-full">
			<thead>
				<tr>
					<th>Action</th>
					<th>Concept</th>
					<th>Change</th>
					<th>Suggested</th>
					<th>Approved</th>
					<th>Applied</th>
					<th>Version</th>
					<th></th>
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
								<li><span class="font-semibold">{label}</span>: {categories_display({ value, old })}</li>
							{/if}
							{#if change.data.curated_examples}
								<li><span class="font-semibold">Curated examples</span> updated</li>
							{/if}
						</ul>
					</td>
					<td>
						{#if change.suggested_by}
							<div class="flex flex-col gap-0.5">
								<span>{format_datetime({ date: change.suggested_by.date, ...data })}</span>
								<!-- TODO: Show user name instead of email once user profile data is tracked in Changes -->
								<span class="text-xs opacity-75 font-mono">{change.suggested_by.email}</span>
							</div>
						{/if}
					</td>
					<td>
						{#if change.approved_by}
							<div class="flex flex-col gap-0.5">
								<span>{format_datetime({ date: change.approved_by.date, ...data })}</span>
								<!-- TODO: Show user name instead of email once user profile data is tracked in Changes -->
								<span class="text-xs opacity-75 font-mono">{change.approved_by.email}</span>
							</div>
						{/if}
					</td>
					<td>
						{#if change.is_unsynced}
							<span class="badge badge-warning badge-soft gap-1">
								<Icon icon="mdi:cloud-off-outline" class="h-4 w-4" />
								Unsynced
							</span>
						{:else}
							{change.applied_date ? format_datetime({ date: change.applied_date, ...data }) : 'Pending'}
						{/if}
					</td>
					<td>
						{change.version || ''}
					</td>
					<td>
						{#if change.can_approve}
							<button
								onclick={() => approve(change)}
								disabled={approving_id === change.id}
								class="btn btn-sm btn-primary"
							>
								{#if approving_id === change.id}
									<span class="loading loading-spinner loading-xs"></span>
								{:else}
									Approve
								{/if}
							</button>
						{/if}
					</td>
				</tr>
			{/each}
			</tbody>
		</table>
	{:else}
		No changes to show yet.
	{/if}
</div>