import { PUBLIC_CORS_ALLOW_LOCALHOST } from '$env/static/public'
import { create_cors_handle } from '@tabitha/cors'
import type { Handle } from '@sveltejs/kit'

export const handle: Handle = create_cors_handle({ allow_localhost: Boolean(PUBLIC_CORS_ALLOW_LOCALHOST) })
