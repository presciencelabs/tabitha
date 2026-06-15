<script>
	import { usage_info } from '$lib/lookups'

	/** @type {{ part_of_speech: string, categories: string[], offset?: number }} */
	const { part_of_speech, categories = $bindable(), offset = 0 } = $props()

</script>

<fieldset class="rounded-lg border p-4">
	<legend class="rounded-lg bg-base-200 px-2">Usage Info</legend>

	{#each usage_info[part_of_speech] as usage, i}
		<div>
			<select bind:value={categories[i + offset]} name="categories[]" class="select w-30">
				<option value="never {usage}">Never</option>
				<option value="sometimes {usage}">Sometimes</option>
				<option value="always {usage}">Always</option>
			</select>
			{usage}
		</div>
	{/each}
</fieldset>
