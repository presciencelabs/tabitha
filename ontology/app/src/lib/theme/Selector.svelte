<script>
	import { set_theme } from '.'
	import themes from './themes'

	let open = false

	/** @param {string} theme */
	function set(theme) {
		set_theme(theme)

		open=false
	}
</script>

<details class="collapse collapse-arrow" bind:open>
	<summary class="collapse-title">Change theme</summary>

	<ul class="collapse-content">
		{#each themes as theme}
			<li class="mb-1">
				<!-- taken from daisyUI's theme selector design   -->
				<button on:click={() => set(theme)} class="w-full text-left rounded-lg overflow-hidden">
					<div data-theme={theme} class="bg-base-100 text-base-content">
						<div class="grid grid-cols-5 grid-rows-3">
							<div class="col-span-5 row-span-3 row-start-1 flex items-center gap-2 px-4 py-3">
								<div class="flex-grow text-sm">{theme}</div>
								<div class="flex h-full flex-shrink-0 flex-wrap gap-1">
									<div class="bg-primary w-2 rounded"></div>
									<div class="bg-secondary w-2 rounded"></div>
									<div class="bg-accent w-2 rounded"></div>
									<div class="bg-neutral w-2 rounded"></div>
								</div>
							</div>
						</div>
					</div>
				</button>
			</li>
		{/each}
	</ul>
</details>
