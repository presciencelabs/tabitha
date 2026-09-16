const FUMS_SCRIPT_SRC = 'https://pkg.api.bible/fumsV3.min.js'

/**
 * The globals api.bible's tracker installs, described locally rather than by augmenting `Window`
 * -- global augmentation needs a mergeable `interface`, and these belong to a third-party script
 * this one module talks to anyway.
 */
type FumsWindow = Window & {
	fumsData?: unknown[]
	fums?: (...args: unknown[]) => void
}

/**
 * Reports a rendered scripture view to api.bible's Fair Use Management System.
 *
 * FUMS is a condition of the license on the Bibles we search, and it counts *views*, not
 * requests -- so this belongs on the client once the verses are actually on screen, not next to
 * the `fetch` on the server. The token identifying the request comes back in the search
 * response's `meta.fumsToken` and has to be handed through to the browser to get here.
 */
export function track_scripture_view(fums_token: string): void {
	const fums_window = window as FumsWindow
	const queue = fums_window.fumsData ??= []

	fums_window.fums ??= (...args: unknown[]) => void queue.push(args)

	load_tracker_once()

	fums_window.fums('trackView', fums_token)
}

/**
 * The queue above is what makes this safe to call before the script has finished loading: calls
 * made in the meantime are buffered and replayed once it arrives.
 */
function load_tracker_once(): void {
	if (document.querySelector(`script[src="${FUMS_SCRIPT_SRC}"]`)) {
		return
	}

	const script = document.createElement('script')
	script.src = FUMS_SCRIPT_SRC
	script.async = true
	document.head.append(script)
}
