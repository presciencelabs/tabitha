// taken from https://kit.svelte.dev/docs/service-workers
//
/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { build, files, version } from '$service-worker'

declare const self: ServiceWorkerGlobalScope

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`

const ASSETS = [
	...build, // the app itself
	...files, // everything in `static`
]

self.addEventListener('install', (event: ExtendableEvent) => event.waitUntil(addFilesToCache()))
self.addEventListener('activate', (event: ExtendableEvent) => event.waitUntil(deleteOldCaches()))
self.addEventListener('fetch', (event: FetchEvent) => {
	// ignore POST requests etc
	if (event.request.method !== 'GET') return

	event.respondWith(respond(event.request))
})

// Create a new cache and add all files to it
async function addFilesToCache() {
	const cache = await caches.open(CACHE)
	await cache.addAll(ASSETS)
}

// Remove previous cached data from disk
async function deleteOldCaches() {
	for (const key of await caches.keys()) {
		if (key !== CACHE) await caches.delete(key)
	}
}

async function respond(request: Request): Promise<Response> {
	const url = new URL(request.url)
	const cache = await caches.open(CACHE)

	// `build` and `files` can always be served from the cache
	if (ASSETS.includes(url.pathname)) {
		const cached = await cache.match(url.pathname)
		if (cached) return cached
	}

	// for everything else, try the network first, but
	// fall back to the cache if we're offline
	try {
		const response = await fetch(request)

		if (response.status === 200) {
			cache.put(request, response.clone())
		}

		return response
	} catch {
		const cached = await cache.match(request)
		if (cached) return cached
		return new Response('Offline', { status: 503 })
	}
}
