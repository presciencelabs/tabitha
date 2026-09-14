<script lang="ts">
	import { set_theme, theme_state } from './theme.svelte'
	import themes, { to_daisyui_theme } from './themes'

	type Props = {
		colors?: string
	}

	let { colors = '' }: Props = $props()

	function select_theme(theme: string) {
		set_theme(theme)
		if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
			document.activeElement.blur()
		}
	}
</script>

<div class="dropdown dropdown-top">
	<div tabindex="0" role="button" class="btn btn-sm gap-2 capitalize {colors || 'btn-outline'}">
		<span>{theme_state.current}</span>
		<svg class="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
		</svg>
	</div>

	<div
		class="dropdown-content z-[100] mb-2 p-2 shadow-2xl bg-base-200 border border-base-300 text-base-content rounded-box w-80 max-h-80 overflow-y-auto"
	>
		<div class="flex flex-col gap-1.5 w-full">
			{#each themes as theme}
				<div
					class="relative w-full overflow-hidden rounded-lg border border-base-300 transition-all hover:scale-[1.01] has-checked:ring-2 has-checked:ring-primary"
				>
					<input
						type="radio"
						name="theme"
						value={to_daisyui_theme(theme)}
						checked={theme_state.current === theme}
						onchange={() => select_theme(theme)}
						class="theme-controller absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
					/>
					<div data-theme={to_daisyui_theme(theme)} class="w-full bg-base-100 text-base-content px-4 py-2.5">
						<div class="flex items-center justify-between gap-4">
							<span class="text-sm font-semibold capitalize truncate">{theme}</span>
							<div class="flex h-4 shrink-0 gap-1.5 items-center">
								<div class="w-2.5 h-3.5 rounded bg-primary"></div>
								<div class="w-2.5 h-3.5 rounded bg-secondary"></div>
								<div class="w-2.5 h-3.5 rounded bg-accent"></div>
								<div class="w-2.5 h-3.5 rounded bg-neutral"></div>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
