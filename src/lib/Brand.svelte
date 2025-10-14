<script lang="ts">
	import { Status } from '$lib/network'
	import Icon from '@iconify/svelte'

	let { version } = $props()
</script>

<div class="prose">
	<h1 class="mb-0 hidden md:block">
		Ontology <sup class="relative -top-6 end-16 text-sm text-neutral-500">TaBiThA</sup>
	</h1>

	<div class="flex items-center gap-4">
		<span class="text-sm font-mono">{version}</span>

		<a href="/downloads" class="btn btn-xs btn-soft btn-accent btn-square" title="Downloads">
			<Icon icon="material-symbols:dynamic-feed-rounded" class="h-5 w-5" />
		</a>
	</div>


	<Status --width="80%" />
</div>
