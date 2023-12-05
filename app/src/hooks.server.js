import { building } from '$app/environment';


/** @type {import('@sveltejs/kit').Handle} */
export async function handle({event, resolve}) {
	if (!event.platform?.env.DB_Sources) {
		// necessary because of all this stuff:
		//		https://github.com/sveltejs/kit/issues/4292
		//		https://github.com/sveltejs/kit/issues/10389
		//
		// possible solution:  https://github.com/gerhardcit/svelte-cf-bindings-poc
		//
		if (!building) {
			throw new Error(`database missing from platform arg: ${JSON.stringify(event.platform)}`)
		}
	}

	// putting it on `locals` to clean up usage in routes
	event.locals.db = event.platform?.env.DB_Sources

	return await resolve(event)
}