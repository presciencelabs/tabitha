<script lang="ts">
	import { lwc_info, mtt_level_info, copilot_modes } from '$lib/lookups'
	import SettingsDialog from './SettingsDialog.svelte'
	import LanguageProfile from './LanguageProfile.svelte'
	import Icon from '@iconify/svelte'
	import type { CopilotSettings } from '$lib/types'

	type Props = {
		settings: CopilotSettings
	}
	let { settings = $bindable() }: Props = $props()

	let show_settings_dialog = $state(false)
	function change_settings() {
		show_settings_dialog = true
	}
	function close_settings() {
		show_settings_dialog = false
	}
	
	let show_profile_dialog = $state(false)
	function change_profile() {
		show_profile_dialog = true
	}
	function close_profile() {
		show_profile_dialog = false
	}
</script>

<button onclick={change_settings} class="btn btn-md">
	<Icon icon="material-symbols:settings" class="h-5 w-5" />
	Settings
</button>

<button onclick={change_profile} class="btn btn-md">
	<Icon icon="mdi:playlist-edit" class="h-6 w-6" />
	Language Profile
</button>

{#if show_settings_dialog}
	<SettingsDialog heading='Options/Settings' onclose={close_settings} fit_content>
		<div class="text-sm">
			<div class="mb-2 grid grid-cols-[max-content_1fr] items-center gap-x-3 gap-y-2">
				<label for="settings-sensitivity">Sensitivity</label>
				<select id="settings-sensitivity" bind:value={settings.sensitivity} class="select">
					{#each [1, 2, 3, 4, 5] as sentitivity_level}
						<option value={sentitivity_level}>{sentitivity_level}</option>
					{/each}
				</select>

				<label for="settings-mtt-level">Detail Level</label>
				<select id="settings-mtt-level" bind:value={settings.mtt_level} class="select">
					{#each Object.entries(mtt_level_info) as [mtt_level, info]}
						<option value={mtt_level}>{info.label}</option>
					{/each}
				</select>

				<label for="settings-lwc">LWC</label>
				<div class="flex flex-col gap-2">
					<select id="settings-lwc" bind:value={settings.lwc} class="select">
						{#each Object.keys(lwc_info) as lwc}
							<option value={lwc}>{lwc}</option>
						{/each}
					</select>
					{#if settings.lwc !== 'English'}
						<label>
							<input type="checkbox" bind:checked={settings.show_english} />
							Show English
						</label>
					{/if}
				</div>

				<label for="settings-mode">Mode</label>
				<select id="settings-mode" bind:value={settings.mode} class="select">
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
	</SettingsDialog>
{/if}

{#if show_profile_dialog}
	<SettingsDialog heading='Language Profile' onclose={close_profile}>
		<LanguageProfile bind:profile={settings.language_profile} />
	</SettingsDialog>
{/if}