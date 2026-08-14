<script>
	import { usage_info } from '$lib/lookups'

	/** @type {{ part_of_speech: string, categories: string[], offset?: number }} */
	const { part_of_speech, categories = $bindable(), offset = 0 } = $props()

</script>

<fieldset class="fieldset border border-base-300 rounded-box p-4">
	<legend class="fieldset-legend font-semibold">Usage Info</legend>

	{#each usage_info[part_of_speech] as usage, i}
		<div class="flex items-center gap-2 my-1">
			<select bind:value={categories[i + offset]} name="categories[]" class="select w-32">
				<option value="never {usage}">Never</option>
				<option value="sometimes {usage}">Sometimes</option>
				<option value="always {usage}">Always</option>
			</select>
			<span>{usage}</span>
		</div>
	{/each}
</fieldset>
