<script>
	export let color_classes = 'bg-info text-info-content'
</script>

<div class="dropdown dropdown-hover dropdown-top">
	<div class="overflow-x-auto dropdown-content z-[1] menu shadow-xl {color_classes} rounded-box w-96 max-h-80">
		<slot name="popup_content" />
	</div>
	<div role="button">
		<slot name="button_content" />
	</div>
</div>