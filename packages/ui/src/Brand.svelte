<script lang="ts">
	interface Props {
		app?: string
	}

	let { app = 'TaBiThA' }: Props = $props()
</script>

<div class="prose">
	<h1 class="hidden md:block mb-4 pe-14">
		<span class="relative inline-block">
			{app}
			<sup class="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 text-xs font-normal text-base-content/60">TaBiThA</sup>
		</span>
	</h1>
</div>
