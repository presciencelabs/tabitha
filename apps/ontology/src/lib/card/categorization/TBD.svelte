<script lang="ts">
	interface Props {
		categories: string[]
	}

	let { categories }: Props = $props()
</script>

<pre data-tip="TBD: still needs to be decoded" class="indicator tooltip tooltip-right inline whitespace-normal">
	{categories.length ? categories : '–'}
	<span class="badge indicator-item badge-warning badge-xs"></span>
</pre>
