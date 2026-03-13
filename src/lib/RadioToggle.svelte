<script lang="ts">
	interface Props {
		label: string
		value: boolean
	}
	let { label, value = $bindable() }: Props = $props()
	const name = $derived(label.toLowerCase().replaceAll(' ', '_'))
</script>

<tr>
	<td>{label}</td>
	<td>
		<label>
			<input name={name} bind:group={value} class="radio radio-xs" type="radio" value={true} />
			Present
		</label>
	</td>
	<td>
		<label>
			<input name={name} bind:group={value} class="radio radio-xs" type="radio" value={false} />
			Absent
		</label>
	</td>
</tr>