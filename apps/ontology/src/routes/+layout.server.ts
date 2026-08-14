import { is_authorized } from '$lib/server/auth'
import { get_version } from '$lib/server/ontology'
import type { LayoutServerLoadEvent } from './$types'
import type { User } from '@auth/sveltekit'

interface LayoutData {
	version: string
	user: User|undefined
	can_update: boolean
	can_add: boolean
}

export async function load({ locals }: LayoutServerLoadEvent): Promise<LayoutData> {
	const version = await get_version(locals.db_ontology)

	const session = await locals.auth()

	const can_update = await is_authorized(locals, 'UPDATE_CONCEPT')
	const can_add = await is_authorized(locals, 'ADD_CONCEPT')

	return {
		version,
		user: session?.user,
		can_update,
		can_add,
	}
}
