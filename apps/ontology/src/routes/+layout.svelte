<script lang="ts">
	import '$lib/app.css'

	import { page } from '$app/state'
	import { Search } from '$lib'
	import { Header, Footer } from '@tabitha/ui'
	import { signIn, signOut } from '@auth/sveltekit/client'
	import Icon from '@iconify/svelte'
	import { useRegisterSW } from 'virtual:pwa-register/svelte'

	let { data, children } = $props()

	let user = $derived(data.user)
	let version = $derived(data.version)
	let show_search_bar = $derived(page.url.pathname === '/')

	const { needRefresh, updateServiceWorker } = useRegisterSW()

	async function sign_out() {
		// https://next-auth.js.org/getting-started/client#signout
		await signOut({ callbackUrl: '/' })
	}
</script>

<!-- layout not handled by daisyUI, https://daisyui.com/docs/layout-and-typography -->

<Header app="Ontology">
	{#if show_search_bar}
		<Search autofocus />
	{/if}
</Header>

<div class="relative -top-2 mx-8 w-fit text-sm font-mono text-base-content/60">{version}</div>

<main class="mx-8 mt-8">
	{@render children?.()}
</main>

<!-- https://daisyui.com/components/footer -->
<Footer colors="bg-accent text-accent-content" needs_refresh={$needRefresh} on_refresh={() => updateServiceWorker(true)}>
	{#if user}
		<div class="flex items-center justify-between w-full">
			<span class="font-serif text-lg tracking-widest">{user.name}</span>

			<button onclick={sign_out} class="btn btn-sm btn-outline btn-error">
				<Icon icon="material-symbols:logout-rounded" class="h-5 w-5" />
			</button>
		</div>

		<span class="text-sm italic">
			{user.email}
		</span>
	{:else}
		<button onclick={() => signIn('google')} class="btn btn-sm btn-outline btn-success">
			Sign in to see additional features
		</button>
	{/if}

	<div class="divider w-full divider-accent"></div>
	<a href="/downloads" class="link link-hover">Ontology downloads</a>
</Footer>
