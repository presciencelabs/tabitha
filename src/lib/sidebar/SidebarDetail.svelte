<script>
	const { details_content, summary_title, start_open=false } = $props()
</script>

<div class="collapse collapse-arrow bg-base-100 border-base-300 border">
	<input type="checkbox" checked={start_open} />
	<div class="collapse-title font-semibold after:start-5 after:end-auto py-2 pe-4 ps-12">
		{summary_title}
	</div>
	<div class="collapse-content text-sm">
		{@render details_content()}
	</div>
</div>