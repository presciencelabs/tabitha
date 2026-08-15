<script lang="ts">
	import { ThemeSelector } from '@tabitha/ui'

	interface Props {
		colors?: string
	}

	let { colors = '' }: Props = $props()
</script>

<ThemeSelector {colors} />
