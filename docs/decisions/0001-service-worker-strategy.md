# 0001: Service workers via `vite-plugin-pwa` (Workbox), not hand-rolled

## Status

Accepted

## Context

None of the five apps (`copilot`, `editor`, `ontology`, `sources`, `targets`) had a consistent service-worker strategy. `editor` and `ontology` each carry a hand-rolled service worker (`src/service-worker/index.ts` / `src/service-worker.ts`) built on SvelteKit's built-in `$service-worker` module — nearly identical copies of the SvelteKit docs' boilerplate, predating the monorepo migration. `copilot`, `sources`, and `targets` have none.

The goal is a modern, consistently-implemented service-worker strategy across all five apps: starting with simple asset/URL caching, with some apps eventually needing offline data-write support — client-side changes queued and synced back once connectivity returns.

## Decision

Adopt `vite-plugin-pwa`, via its SvelteKit-specific wrapper `@vite-pwa/sveltekit`, as the shared service-worker implementation — piloted on `targets` first — rather than hand-rolling and extending SvelteKit's native `$service-worker` pattern that `editor`/`ontology` already use.

Getting the `targets` pilot building required working through a few points of friction against SvelteKit's own conventions, all resolved and accepted as one-time integration cost rather than reasons to avoid the library:

- Disabling SvelteKit's native service-worker registration (`kit.serviceWorker.register: false`) so it doesn't conflict with the plugin's own registration.
- Working around a `workbox-window` module-resolution failure under pnpm's strict `node_modules` linking (undocumented in the official guide) by adding it as a direct devDependency.
- Adding an ambient TypeScript reference (`vite-plugin-pwa/client`) to type-check the `virtual:pwa-register/svelte` import.
- Disabling manifest generation (`manifest: false`) since no app icons exist yet — installability is deferred, not abandoned.

## Alternatives considered

**Hand-rolled, extending SvelteKit's native `$service-worker`** — the pattern already proven in `editor`/`ontology`, generalized into a shared factory each app's own `src/service-worker.ts` would call. This was the initial direction, and was actually implemented and reverted once before landing on this decision. It was set aside because of what it would cost to build and maintain by hand as requirements grow:

- No caching-strategy library: cache expiration, `maxEntries`, and correct handling of opaque cross-origin responses would all need to be built and tested in-house. The current `editor`/`ontology` service workers already show the risk here — they cache every successful GET response indefinitely with no expiration, until the next deploy wipes the whole cache.
- No `workbox-background-sync` equivalent: the offline data-write-sync goal would require building an IndexedDB-backed request queue and replay logic entirely from scratch, rather than reusing a maintained implementation.
- No dev-mode service-worker testing — native service workers only run against a real `vite build` output.
- Coarser precache invalidation: a deploy bump wipes the *entire* cache via the `version` string, rather than Workbox's per-file content-hash revisioning.

Given the project's longer-term offline-sync ambitions, the ongoing cost of hand-building and maintaining Workbox-equivalent functionality outweighed the one-time integration friction of adopting the library.

## Consequences

- The shared implementation now depends on `vite-plugin-pwa`/`@vite-pwa/sveltekit` and its Workbox internals, with the workarounds above baked into each app's config as the cost of that dependency.
- `editor`/`ontology`'s existing hand-rolled service workers are not yet migrated to this approach; migrating them is follow-up work once the `targets` pilot is validated further.
- Update-detection/reload-prompting is unaffected either way: it's already solved independently via SvelteKit's `updated` store and the shared `UpdateToast` component (`packages/ui`) — though `UpdateToast` now also accepts an external `needs_refresh`/`on_refresh` signal so apps on this plugin can drive it from the plugin's own `useRegisterSW().needRefresh` instead.
- Manifest/installability (`manifest: false` in the pilot) is deferred until the apps have real icons — a small follow-up, not a blocker.
