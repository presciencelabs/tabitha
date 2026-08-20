// Shared console logger for the migration scripts. Gives every phase (Orchestrator, Sources
// migration, Ontology migration, ...) a consistent tag, color, and verbosity behavior instead of
// each file hand-rolling its own `console.log('[Phase] ...')` calls.
//
// Verbosity is controlled by the LOG_LEVEL env var ('quiet' | 'normal' | 'verbose', default 'normal').
// Since the orchestrator spawns each phase as a child process, setting LOG_LEVEL once before
// `bun migrations/orchestrator.ts` propagates it to every phase automatically.

export type LogLevel = 'quiet' | 'normal' | 'verbose'

export type Logger = {
	/** A named step within the phase, e.g. "Fetching all source encoding...". Hidden when quiet. */
	step(message: string): void
	/** A minor, secondary detail, e.g. a row count. Hidden when quiet. */
	info(message: string): void
	/** Always shown, regardless of verbosity. */
	success(message: string): void
	/** Always shown, and counted toward the phase's summary(). `context` is typically a reference like a book/verse. */
	warn(message: string, context?: string): void
	/** Always shown, and counted toward the phase's summary(). */
	error(message: string, context?: string): void
	/** Only shown when LOG_LEVEL=verbose. */
	verbose(message: string): void
	/** Overwrites a single status line in place instead of printing a new line per call. */
	progress(label: string, current: number, total: number): void
	/** Moves off the in-place progress line so subsequent output starts on a fresh line. */
	finish_progress(): void
	/** Prints a one-line roundup of how many warnings/errors this phase logged. */
	summary(): void
}

const LEVEL_RANK: Record<LogLevel, number> = { quiet: 0, normal: 1, verbose: 2 }

function parse_level(raw: string | undefined): LogLevel {
	return raw === 'quiet' || raw === 'verbose' ? raw : 'normal'
}

const level = parse_level(process.env.LOG_LEVEL)
const use_color = !!process.stdout.isTTY && !process.env.NO_COLOR

function paint(code: number): (text: string) => string {
	return text => use_color ? `\x1b[${code}m${text}\x1b[0m` : text
}

const dim = paint(2)
const yellow = paint(33)
const red = paint(31)
const green = paint(32)

const loggers = new Map<string, Logger>()

/** Returns the shared logger for a phase name, creating it on first use. All callers for the same phase share one warning/error tally, so the final summary() reflects the whole phase, however many files logged to it. */
export function create_logger(phase: string): Logger {
	const existing = loggers.get(phase)
	if (existing) {
		return existing
	}

	const logger = build_logger(phase)
	loggers.set(phase, logger)
	return logger
}

export function is_verbose(): boolean {
	return level === 'verbose'
}

function build_logger(phase: string): Logger {
	const tag = dim(`[${phase}]`)
	const warnings: string[] = []
	const errors: string[] = []
	let progress_active = false

	function finish_progress() {
		if (progress_active) {
			process.stdout.write('\n')
			progress_active = false
		}
	}

	return {
		step(message) {
			if (LEVEL_RANK[level] < LEVEL_RANK.normal) return
			finish_progress()
			console.info(`${tag} ▸ ${message}`)
		},
		info(message) {
			if (LEVEL_RANK[level] < LEVEL_RANK.normal) return
			finish_progress()
			console.info(`${tag} ${dim(message)}`)
		},
		success(message) {
			finish_progress()
			console.info(`${tag} ${green('✅')} ${message}`)
		},
		warn(message, context) {
			finish_progress()
			const full = context ? `${message} (${context})` : message
			warnings.push(full)
			console.warn(`${tag} ${yellow('⚠️')}  ${full}`)
		},
		error(message, context) {
			finish_progress()
			const full = context ? `${message} (${context})` : message
			errors.push(full)
			console.error(`${tag} ${red('❌')} ${full}`)
		},
		verbose(message) {
			if (level !== 'verbose') return
			finish_progress()
			console.info(`${tag} ${dim(message)}`)
		},
		progress(label, current, total) {
			if (LEVEL_RANK[level] < LEVEL_RANK.normal) return
			const width = 24
			const ratio = total > 0 ? Math.min(current / total, 1) : 0
			const filled = Math.round(width * ratio)
			const bar = '#'.repeat(filled) + '-'.repeat(width - filled)
			const percent = `${Math.round(ratio * 100)}`.padStart(3)
			const counts = `${current.toLocaleString()}/${total.toLocaleString()}`
			const warning_flag = warnings.length > 0 ? ` ${yellow(`⚠ ${warnings.length}`)}` : ''
			process.stdout.write(`\r${tag} [${bar}] ${percent}%  ${counts}  ${label}${warning_flag}\x1b[K`)
			progress_active = true
		},
		finish_progress,
		summary() {
			finish_progress()
			const parts: string[] = []
			if (errors.length > 0) parts.push(red(`${errors.length} error${errors.length === 1 ? '' : 's'}`))
			if (warnings.length > 0) parts.push(yellow(`${warnings.length} warning${warnings.length === 1 ? '' : 's'}`))
			const status = parts.length > 0 ? parts.join(', ') : green('no issues')
			console.info(`${tag} 🏁 ${status}`)
		},
	}
}
