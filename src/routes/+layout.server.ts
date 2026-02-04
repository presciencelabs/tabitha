import { is_authorized } from '$lib/server/auth'
import { get_version } from '$lib/server/ontology'
import type { LayoutServerLoadEvent } from './$types'
import type { User } from '@auth/sveltekit'

export async function load({ locals }: LayoutServerLoadEvent): Promise<{ user: User|undefined, version: string, can_update: boolean }> {
	const version = await get_version(locals.db_ontology)

	const session = await locals.auth()

	const can_update = await is_authorized(locals, 'UPDATE_CONCEPT')

	return {
		version,
		user: session?.user,
		can_update,
	}
}
