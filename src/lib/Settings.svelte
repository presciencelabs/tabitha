<script lang="ts">
	import { language_profile_infos } from '$lib/lookups'
	import Icon from '@iconify/svelte'

	interface Props {
		settings: CopilotSettings
	}
	let { settings = $bindable() }: Props = $props()

	const lwcs = ['English', 'Arabic', 'Cebuano', 'French', 'Hindi', 'Indonesian', 'Mandarin', 'Portugese', 'Russian', 'Spanish', 'Swahili', 'Tagalog', 'Tok Pisin']
</script>

<details class="collapse collapse-arrow bg-base-100 border-base-300 border">
	<summary class="collapse-title font-semibold">Options/Settings</summary>
	<div class="collapse-content text-sm">
		<div class="mb-2">
			Number of notes
			<select class="select" bind:value={settings.max_cautions}>
				<option value={-1}>No limit</option>
				{#each [1, 2, 3, 4, 5] as num}
					<option value={num}>{num}</option>
				{/each}
			</select>
		</div>
		<div class="mb-2">
			MTT education level
			<select class="select" bind:value={settings.mtt_level}>
				<option value="grade5">Grade 5</option>
				<option value="high_school">High-school</option>
				<option value="undergraduate">Undergraduate</option>
			</select>
		</div>
		<div>
			LWC
			<select class="select" bind:value={settings.lwc}>
				{#each lwcs as lwc}
					<option value={lwc}>{lwc}</option>
				{/each}
			</select>
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