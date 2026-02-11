<script lang="ts">
	interface Props {
		nav_data: NavData
	}
	let { nav_data }: Props = $props()

	function create_reference_string({ id_primary, id_secondary, id_tertiary }: Reference) {
		return `${id_primary} ${id_secondary}:${id_tertiary}`
	}

	function create_url({ type, id_primary, id_secondary, id_tertiary }: Reference) {
		return `/${type}/${id_primary}/${id_secondary}/${id_tertiary}`
	}
</script>

<div class="flex join">
	{#if nav_data.previous}
		<a class="btn btn-md join-item text-xl" href="{create_url(nav_data.previous)}" title="{create_reference_string(nav_data.previous)}" target="_self" >
			«
		</a>
	{/if}

	<!--'content-center' gets overwritten by 'prose', so use the element style to prioritize its effect-->
	<div class="join-item px-5 prose bg-base-200 border border-base-300" style="align-content: center">
		<h2>{create_reference_string(nav_data.current)}</h2>
	</div>

	{#if nav_data.next}
		<a class="btn btn-md join-item text-xl" href="{create_url(nav_data.next)}" title="{create_reference_string(nav_data.next)}" target="_self">
			»
		</a>
	{/if}
</div>