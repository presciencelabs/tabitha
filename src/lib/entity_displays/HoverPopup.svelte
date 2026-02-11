<script>
	const { dropdown_content, button_content } = $props()
	import { view_settings } from '$lib/settings/settings.svelte.js'
</script>

{#if view_settings.show_hover_popups}
	<div class="dropdown dropdown-hover dropdown-bottom">
		<div class="overflow-x-auto dropdown-content z-[1] text-sm p-2 shadow-xl rounded-box w-96 text-base-content bg-base-100 tracking-normal mt-2 -ms-1">
			{@render dropdown_content()}
		</div>
		<div role="button">
			{@render button_content()}
		</div>
	</div>
{:else}
	{@render button_content()}
{/if}
