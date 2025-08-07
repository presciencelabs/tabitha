<script>
	import { page } from '$app/state'
</script>

<!--We want to show the Header with the search bar here, and without this page, it is not shown-->

<div class="flex justify-center prose max-w-full">
	<h2>{page.status}</h2>
</div>

<div class="flex justify-center prose max-w-full">
	<p>{page.error?.message}</p>
</div>