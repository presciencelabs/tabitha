<script lang="ts">
	import { lwc_info, mtt_level_info, copilot_modes } from '$lib/lookups'
	import Icon from '@iconify/svelte'

	interface Props {
		settings: CopilotSettings
	}
	let { settings = $bindable() }: Props = $props()

	const noun_number_options = ['Dual', 'Trial', 'Quadrial']
	const noun_proximity_options = [
		'Near Speaker and Listener',
		'Near Speaker',
		'Near Listener',
		'Remote within Sight',
		'Remote out of Sight',
		'Temporally Near',
		'Temporally Remote',
		'Contextually Near with Focus',
		'Contextually Near',
	]
</script>

<details class="collapse collapse-arrow bg-base-100 border-base-300 border">
	<summary class="collapse-title font-semibold">Options/Settings</summary>
	<div class="collapse-content text-sm">
		<div class="mb-2">
			Sensitivity
			<select bind:value={settings.sensitivity} class="select">
				{#each [1, 2, 3, 4, 5] as sentitivity_level}
					<option value={sentitivity_level}>{sentitivity_level}</option>
				{/each}
			</select>
		</div>
		<div class="mb-2">
			Detail Level
			<select bind:value={settings.mtt_level} class="select">
				{#each Object.entries(mtt_level_info) as [mtt_level, info]}
					<option value={mtt_level}>{info.label}</option>
				{/each}
			</select>
		</div>
		<div class="mb-2">
			LWC
			<select bind:value={settings.lwc} class="select pl-1">
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
		<div class="mb-2">
			Mode
			<select bind:value={settings.mode} class="select">
				{#each copilot_modes as mode}
					<option value={mode}>{mode[0].toUpperCase()}{mode.slice(1)}</option>
				{/each}
			</select>
		</div>
		<div>
			<label>
				<input type="checkbox" bind:checked={settings.show_note_sources} />
				Show note sources
			</label>
		</div>
	</div>

	<details class="collapse collapse-arrow bg-base-200 border-base-300 border m-2 w-[80%]">
		{#snippet info_popup(info: string)}
			<div class="dropdown dropdown-hover dropdown-right dropdown-center">
				<div role="button" class="btn btn-circle btn-ghost btn-xs text-info">
					<Icon icon="mdi:information-slab-circle-outline" class="h-4 w-4" />
				</div>
				<div class="card card-sm dropdown-content bg-base-100 rounded-box w-80 shadow-sm">
					<div class="card-body">
						{info}
					</div>
				</div>
			</div>
		{/snippet}

		<summary class="collapse-title font-semibold">Language Profile</summary>
		<div class="collapse-content text-sm">
			<table class="table table-sm">
			<colgroup>
				<col class="w-1/4" />
				<col class="w-3/4" />
			</colgroup>
				<tbody>
					<tr>
						<td>
							Verb tense
							{@render info_popup('If your language marks multiple levels of past or future, TaBiThA can show notes to help you decide which level to use.')}
						</td>
						<td>
							<div class="flex flex-col gap-1">
								<label>
									<input type="checkbox" bind:checked={settings.language_profile.multiple_past} class="checkbox checkbox-sm" />
									Multiple levels of past
								</label>
								<label>
									<input type="checkbox" bind:checked={settings.language_profile.multiple_future} class="checkbox checkbox-sm" />
									Multiple levels of future
								</label>
							</div>
						</td>
					</tr>
					<tr>
						<td>
							Noun number
							{@render info_popup('If your language has special marking for when there are exactly two (Dual), three (Trial) or four (Quadrial) of a thing (eg "John\'s EYES"), TaBiThA can show notes to identify words that might need these markings.')}
						</td>
						<td>
							<div class="flex flex-col gap-1">
								{#each noun_number_options as value}
									<label>
										<input type="checkbox" value={value} bind:group={settings.language_profile.noun_number} class="checkbox checkbox-sm" />
										{value}
									</label>
								{/each}
							</div>
						</td>
					</tr>
					<tr>
						<td>
							Noun proximity
							{@render info_popup('Select the noun proximities that are notable for your language, and that you would like notes about in order to help avoid confusion.')}
						</td>
						<td>
							<div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
								{#each noun_proximity_options as value}
									<label>
										<input type="checkbox" value={value} bind:group={settings.language_profile.noun_proximity} class="checkbox checkbox-sm" />
										{value}
									</label>
								{/each}
							</div>
						</td>
					</tr>
					<tr>
						<td>
							Noun person
							{@render info_popup('If your language marks inclusive "we" (we with you) differently from exclusive "we" (we without you), TaBiThA can show notes to help you decide which one to use.')}
						</td>
						<td>
							<label>
								<input type="checkbox" bind:checked={settings.language_profile.noun_clusivity} class="checkbox checkbox-sm" />
								Inclusive and exclusive "we"
							</label>
						</td>
					</tr>
					<tr>
						<td>
							Passive voice
							{@render info_popup('TaBiThA can show notes related to how your language handles passive verbs, if at all.')}
						</td>
						<td>
							<select bind:value={settings.language_profile.passive} class="select select-sm">
								<option value="none">None</option>
								<option value="agent_forbidden">Yes, but never with an agent</option>
								<option value="agent_allowed">Yes, and an agent may be included</option>
								<option value="other">It's not so simple</option>
							</select>
						</td>
					</tr>
					<tr>
						<td>
							Rhetorical questions
							{@render info_popup('If your language does not use or understand rhetorical questions, TaBiThA can show notes for a rhetorical question to explain its purpose and suggest an equivalent statement.')}
						</td>
						<td>
							<select bind:value={settings.language_profile.rhetorical_questions} class="select select-sm">
								<option value={true}>Rhetorical questions are understood</option>
								<option value={false}>Statements are preferred</option>
							</select>
						</td>
					</tr>
					<tr>
						<td>
							Speech formula position
							{@render info_popup('If your language puts or repeats the speech formula (eg. "John said to Mary") at the end of the quote, TaBiThA can show reminders about the speaker and listener of longer quotes.')}
						</td>
						<td>
							<select bind:value={settings.language_profile.speech_formula_position} class="select select-sm">
								<option value="before">Before</option>
								<option value="after">After</option>
								<option value="either">Either</option>
								<option value="both">Both</option>
							</select>
						</td>
					</tr>
					<tr>
						<td>
							Honorifics
							{@render info_popup('If your language has special markings or pronouns for acknowledging social relationships or dynamics, TaBiThA can show notes to help identify these relationships.')}
						</td>
						<td>
							<div class="flex flex-col gap-1">
								<label>
									<input type="radio" value={false} bind:group={settings.language_profile.honorifics} class="radio radio-xs" />
									None
								</label>
								<label>
									<input type="radio" value={true} bind:group={settings.language_profile.honorifics} class="radio radio-xs" />
									Yes, some honorifics
								</label>
							</div>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</details>
</details>