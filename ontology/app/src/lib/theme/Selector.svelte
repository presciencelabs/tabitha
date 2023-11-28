<script>
	import {set_theme} from '.'
	import themes from './themes'

	/** @type {string} class(es) separated by space */
	export let colors = ''

	let open = false

	/** @param {string} theme */
	function set(theme) {
		set_theme(theme)

		open = false
	}
</script>

<details bind:open class={`prose collapse collapse-arrow ${colors}`}>
	<summary class="collapse-title">Change theme</summary>

	<ul class="collapse-content mt-0">
		{#each themes as theme}
			<li class="my-0 list-none pl-0">
				<!-- taken from daisyUI's theme selector design: https://daisyui.com -->
				<button on:click={() => set(theme)} class="my-2 w-full overflow-hidden rounded-lg text-left">
					<div data-theme={theme} class="bg-base-100 text-base-content">
						<div class="grid grid-cols-5 grid-rows-3">
							<div class="col-span-5 row-span-3 row-start-1 flex items-center gap-2 px-4 py-3">
								<div class="flex-grow text-sm">{theme}</div>
								<div class="flex h-full flex-shrink-0 flex-wrap gap-1">
									<div class="w-2 rounded bg-primary"></div>
									<div class="w-2 rounded bg-secondary"></div>
									<div class="w-2 rounded bg-accent"></div>
									<div class="w-2 rounded bg-neutral"></div>
								</div>
							</div>
						</div>
					</div>
				</button>
			</li>
		{/each}
	</ul>
</details>
