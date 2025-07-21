import { get_version } from '$lib/server/ontology'
import type { LayoutServerLoadEvent } from './$types'
import type { User } from '@auth/sveltekit'

export async function load({ locals }: LayoutServerLoadEvent): Promise<{ user: User | undefined, version: string }> {
	const version = await get_version(locals.db_ontology)

	const session = await locals.auth()

	return {
		version,
		user: session?.user,
	}
}
