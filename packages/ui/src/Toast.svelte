<script lang="ts">
	import Icon from '@iconify/svelte'
	import type { Snippet } from 'svelte'

	type Variant = 'success' | 'error' | 'info'

	type Props = {
		variant: Variant
		on_dismiss?: () => void
		children: Snippet
	}

	let { variant, on_dismiss, children }: Props = $props()
</script>

<div class="toast toast-end toast-bottom z-50">
	<div class="alert shadow-lg {variant === 'success' ? 'alert-success' : variant === 'error' ? 'alert-error' : 'alert-info'}">
		{#if variant === 'success'}
			<Icon icon="material-symbols:check-circle-outline" class="h-5 w-5 shrink-0" />
		{:else if variant === 'error'}
			<Icon icon="material-symbols:error-outline-rounded" class="h-5 w-5 shrink-0" />
		{:else}
			<Icon icon="material-symbols:info-outline" class="h-5 w-5 shrink-0" />
		{/if}

		<span>{@render children()}</span>

		{#if on_dismiss}
			<button onclick={on_dismiss} class="btn btn-ghost btn-xs btn-circle" aria-label="Dismiss">
				<Icon icon="material-symbols:close-rounded" class="h-4 w-4" />
			</button>
		{/if}
	</div>
</div>
