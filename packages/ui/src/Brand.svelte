<script lang="ts">
	interface Props {
		name?: string
		classes?: string
	}

	let { name = 'TaBiThA', classes = '' }: Props = $props()
</script>

<span class="font-bold tracking-wide {classes}">{name}</span>
