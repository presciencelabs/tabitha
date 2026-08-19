<script lang="ts">
	import UsageList from './UsageList.svelte'

	type Props = {
		categories: string[]
	}

	let { categories }: Props = $props()

	let semantic_category = $derived(categories[0] || '')
	let usages = $derived(categories.slice(1))
</script>

<fieldset class="prose rounded-lg border p-4">
	<legend class="rounded-lg bg-base-200 px-2 text-lg font-bold tracking-widest">
		{semantic_category || 'None'}
	</legend>

	<UsageList {usages} />
</fieldset>
