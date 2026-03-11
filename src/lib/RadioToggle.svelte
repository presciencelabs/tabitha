<script lang="ts">
	interface Props {
		label: string
		value: boolean
	}
	let { label, value = $bindable() }: Props = $props()
	const name = $derived(label.toLowerCase().replaceAll(' ', '_'))
</script>

<div class="grid grid-cols-3">
	{label}
	<label class="ms-2">
		<input name={name} bind:group={value} class="radio radio-xs" type="radio" value={true} />
		Present
	</label>
	<label class="ms-2">
		<input name={name} bind:group={value} class="radio radio-xs" type="radio" value={false} />
		Absent
	</label>
</div>