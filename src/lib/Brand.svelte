<script lang="ts">
	import { Status } from '$lib/network'

	let { version } = $props()
</script>

<div class="prose">
	<h1 class="mb-0 hidden md:block">
		Ontology <sup class="relative -top-6 end-16 text-sm text-neutral-500">TaBiThA</sup>
	</h1>
	
	<span class="text-sm font-mono">{version}</span>

	<Status --width="80%" />
</div>
