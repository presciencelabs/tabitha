<script lang="ts">
	import Icon from '@iconify/svelte'

	interface Props {
		preference?: 'grid' | 'table'
		onpreference?: (preference: 'grid' | 'table') => void
	}

	let { preference = $bindable('grid'), onpreference }: Props = $props()

	function set_preference(new_preference: 'grid' | 'table') {
		preference = new_preference
		onpreference?.(new_preference)
	}
</script>

<div class="join">
	<button
		type="button"
		class="btn join-item"
		class:btn-accent={preference === 'grid'}
		onclick={() => set_preference('grid')}
		title="Grid View"
	>
		<Icon icon="mdi:view-grid" class="h-5 w-5" />
	</button>

	<button
		type="button"
		class="btn join-item"
		class:btn-accent={preference === 'table'}
		onclick={() => set_preference('table')}
		title="Table View"
	>
		<Icon icon="uiw:table" class="h-5 w-5" />
	</button>
</div>
