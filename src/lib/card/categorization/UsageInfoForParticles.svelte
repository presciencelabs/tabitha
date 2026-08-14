<script lang="ts">
	import UsageList from './UsageList.svelte'

	interface Props {
		categories: string[]
	}

	let { categories }: Props = $props()
</script>

<fieldset class="prose rounded-lg border p-4">
	<!-- prettier-ignore -->
	<legend class="rounded-lg bg-base-200 px-2">
		Semantic categorization
	</legend>

	<UsageList usages={categories} />
</fieldset>
