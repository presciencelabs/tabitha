const THEME_REPORTED_KEY = 'usage_theme_reported'

// Reports the active theme to the current app's /usage/theme once per browser session, so counts
// reflect people rather than page views. sendBeacon is fire-and-forget: failures are ignored.
export function report_active_theme(theme: string | undefined): void {
	if (!theme) return
	if (sessionStorage.getItem(THEME_REPORTED_KEY)) return

	sessionStorage.setItem(THEME_REPORTED_KEY, theme)
	navigator.sendBeacon('/usage/theme', new Blob([JSON.stringify({ theme })], { type: 'application/json' }))
}
