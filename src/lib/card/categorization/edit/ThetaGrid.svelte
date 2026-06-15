<script>
    import { theta_grid_arguments } from '$lib/lookups'

	/** @type {{ categories: string[] }} */
	const { categories = $bindable() } = $props()
</script>

<fieldset class="rounded-lg border p-4">
	<legend class="rounded-lg bg-base-200 px-2">Theta Grid</legend>

	<table>
		<tbody>
		{#each theta_grid_arguments as argument, i}
			<tr>
				<td>
					{argument}
				</td>
				<td class="pl-4">
					<select bind:value={categories[i]} name="categories[]" class="select w-35">
						<option value="">---</option>
						<option value={argument}>Required</option>
						<option value="({argument})">Optional</option>
					</select>
				</td>
			</tr>
		{/each}
		</tbody>
	</table>
</fieldset>
