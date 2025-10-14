<script lang="ts">
	import '$lib/app.css'

	import { Brand, Search } from '$lib'
	import { Selector } from '$lib/theme'
	import { signIn, signOut } from '@auth/sveltekit/client'
	import Icon from '@iconify/svelte'

	let { data, children } = $props()

	let user = $derived(data.user)
	let version = $derived(data.version)

	async function sign_out() {
		// https://next-auth.js.org/getting-started/client#signout
		await signOut({ callbackUrl: '/' })
	}
</script>

<!-- layout not handled by daisyUI, https://daisyui.com/docs/layout-and-typography -->

<header class="grid grid-cols-[auto_1fr] mx-8 mt-8">
	<Brand {version} />

	<Search autofocus />
</header>

<main class="mx-8 mt-8">
	{@render children?.()}
</main>

<!-- https://daisyui.com/components/footer -->
<footer class="footer footer-horizontal mt-20 max-w-none bg-neutral p-10 text-neutral-content">
	<nav>
		<Selector colors="bg-accent text-accent-content" />
	</nav>

	<nav class="justify-self-end">
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
	</nav>
</footer>
