<script lang="ts">
	import type { Snippet } from 'svelte'

	type Props = {
		popup_content: Snippet
		button_content: Snippet
		color_classes?: string
	}

	let { popup_content, button_content, color_classes = 'bg-info text-info-content' }: Props = $props()

	let container_el: HTMLElement | null = $state(null)
	let align_end = $state(false)

	// Dynamically align dropdown if near the right screen edge to prevent horizontal overflow and layout shifts
	function check_position() {
		if (container_el) {
			const rect = container_el.getBoundingClientRect()
			align_end = rect.right > window.innerWidth - 320
		}
	}
</script>

<div
	bind:this={container_el}
	onmouseenter={check_position}
	onfocusin={check_position}
	role="none"
	class="dropdown dropdown-hover dropdown-top {align_end ? 'dropdown-end' : ''}"
>
	<div class="overflow-x-auto dropdown-content z-[1] menu shadow-xl {color_classes} rounded-box w-96 max-w-[calc(100vw-2rem)] max-h-80">
		{@render popup_content()}
	</div>
	<div role="button">
		{@render button_content()}
	</div>
</div>
