<script lang="ts">
	import { language_profile_infos, lwc_info, mtt_level_info } from '$lib/lookups'
	import Icon from '@iconify/svelte'

	interface Props {
		settings: CopilotSettings
	}
	let { settings = $bindable() }: Props = $props()
</script>

<details class="collapse collapse-arrow bg-base-100 border-base-300 border">
	<summary class="collapse-title font-semibold">Options/Settings</summary>
	<div class="collapse-content text-sm">
		<div class="mb-2">
			Sensitivity
			<select class="select" bind:value={settings.sensitivity}>
				{#each [1, 2, 3, 4, 5] as sentitivity_level}
					<option value={sentitivity_level}>{sentitivity_level}</option>
				{/each}
			</select>
		</div>
		<div class="mb-2">
			Detail Level
			<select class="select" bind:value={settings.mtt_level}>
				{#each Object.entries(mtt_level_info) as [mtt_level, info]}
					<option value={mtt_level}>{info.label}</option>
				{/each}
			</select>
		</div>
		<div class="mb-2">
			LWC
			<select class="select pl-1" bind:value={settings.lwc}>
				{#each Object.keys(lwc_info) as lwc}
					<option value={lwc}>{lwc}</option>
				{/each}
			</select>
			
			{#if settings.lwc !== 'English'}
				<label class="pl-2">
					<input type="checkbox" bind:checked={settings.show_english} />
					Show English
				</label>
			{/if}
		</div>
		<div>
			<label>
				<input type="checkbox" bind:checked={settings.show_note_sources} />
				Show note sources
			</label>
		</div>
	</div>

	<details class="collapse collapse-arrow bg-base-200 border-base-300 border m-2 w-[80%]">
		<summary class="collapse-title font-semibold">Language Profile</summary>
		<div class="collapse-content text-sm w-1/2">
			<table class="table table-sm">
				<tbody>
					{#each Object.keys(language_profile_infos) as key}
						{@const typed_key = key as keyof LanguageProfile}
						{@const [label, info] = language_profile_infos[typed_key]}
						<tr>
							<td>
								{label}
								{#if info.length}
									<div class="dropdown dropdown-hover dropdown-right dropdown-center">
										<div role="button" class="btn btn-circle btn-ghost btn-xs text-info">
											<Icon icon="mdi:information-slab-circle-outline" class="h-4 w-4" />
										</div>
										<div class="card card-sm dropdown-content bg-base-100 rounded-box w-64 shadow-sm">
											<div class="card-body">
												{info}
											</div>
										</div>
									</div>
								{/if}
							</td>
							<td>
								<label>
									<input name={key} bind:group={settings.language_profile[typed_key]} class="radio radio-xs" type="radio" value={true} />
									Present
								</label>
							</td>
							<td>
								<label>
									<input name={key} bind:group={settings.language_profile[typed_key]} class="radio radio-xs" type="radio" value={false} />
									Absent
								</label>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</details>
</details>