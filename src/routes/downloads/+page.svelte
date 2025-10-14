<script lang="ts">
	import Icon from '@iconify/svelte'
	import type { PageProps } from './$types'

	let { data }: PageProps = $props()
</script>

<table class="table">
	<thead>
		<tr>
			<th>Database</th>
			<th>Version</th>
			<th>Created</th>
			<th>Size</th>
			<th></th>
		</tr>
	</thead>

	<tbody>
		{#each data.backups as { name, version, created_at, size_mb, url } (name)}
			<tr class="hover:bg-base-300">
				<td>{name}</td>
				<td>{version}</td>
				<td>{created_at.toLocaleString()}</td>
				<td>{size_mb} MB</td>
				<td>
					<!-- download name being controlled by https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Disposition since the download link is cross-origin -->
					<a href={url} download class="btn btn-sm btn-secondary">
						<Icon icon="material-symbols:download-rounded" class="h-5 w-5"/>
					</a>
				</td>
			</tr>
		{:else}
			<tr><td colspan="4">No backups available.</td></tr>
		{/each}
	</tbody>
</table>