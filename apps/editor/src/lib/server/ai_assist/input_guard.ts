// Cloudflare's shared AI Gateway prompt-injection guardrail (P1) is off gateway-wide -- it
// false-positived on this app's own system instruction (see tools/gateway/config.ts and ADR 0007),
// so it couldn't be relied on. This is the resulting local, best-effort substitute, scoped to the
// one place user text actually reaches the model: the ai-assist textarea, which should only ever
// contain English scripture text to encode. It's a denylist, not a guarantee -- it catches naive/
// common injection framings without risking false positives on real verse text the way P1 did.

const MAX_LENGTH = 2000

const SUSPICIOUS_PATTERNS: RegExp[] = [
	/ignore\s+(all\s+|the\s+)?(previous|prior|above)\s+instructions?/i,
	/disregard\s+(all\s+|the\s+)?(previous|prior|above)\s+instructions?/i,
	/new\s+instructions?\s*:/i,
	/system\s+prompt/i,
	/you\s+are\s+now\s+an?\s/i,
	/^\s*(system|assistant|user)\s*:/im,
	/```/,
	/\[INST\]/i,
	/<\|(im_start|im_end|system)\|>/i,
]

/** Returns a user-facing rejection message if `text` looks unsafe to send to the model, or
 * `undefined` if it's fine. */
export function check_input_safety(text: string): string | undefined {
	if (text.length > MAX_LENGTH) {
		return `Text is too long (${text.length} characters, max ${MAX_LENGTH}) -- enter a single verse or short passage.`
	}

	if (SUSPICIOUS_PATTERNS.some(pattern => pattern.test(text))) {
		console.warn(`ai-assist: rejected input matching a suspicious pattern (${text.length} chars)`)
		return 'This text looks like it might contain instructions rather than scripture to encode. Please enter plain English text only.'
	}

	return undefined
}
