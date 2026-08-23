export type PhilosophyFinding = {
	rule_id: number
	rule_title: string
	file_path: string
	line_number: number
	snippet: string
	message: string
}

// Shared across every check_*.ts file: each check pushes its findings here as it scans.
export const findings: PhilosophyFinding[] = []

export const SVELTEKIT_FRAMEWORK_EXEMPTIONS = new Set(['handleError', 'handleFetch', 'handle', 'reroute', 'load'])
