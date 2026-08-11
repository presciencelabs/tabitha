<script>
	/** @type {{ popup_content: import('svelte').Snippet, button_content: import('svelte').Snippet, color_classes?: string }}*/
	let { popup_content, button_content, color_classes = 'bg-info text-info-content' } = $props()
</script>

<div class="dropdown dropdown-hover dropdown-top">
	<div class="overflow-x-auto dropdown-content z-[1] menu shadow-xl {color_classes} rounded-box w-96 max-h-80">
		{@render popup_content()}
	</div>
	<div role="button">
		{@render button_content()}
	</div>
</div>
