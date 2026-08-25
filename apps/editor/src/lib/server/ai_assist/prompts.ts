import { CLAUSE_NOTATIONS } from '$lib/parser/clause_notations'

export type CheckerFeedback = {
	token: string
	label: string
	message: string
}

const WORKED_EXAMPLE = `
	Source text (Mark 1:2, NIV):
	"as it is written in Isaiah the prophet: 'I will send my messenger ahead of you, who will prepare your way'"

	Phase 1 encoding:
	Isaiah [who told God's messages to people] wrote, ["You(Christ) (imp) listen to me(God)]. I(God) (primary) will send my(God's) person [who takes messages to people] [before I(God) send you(Christ)]. I(God) (meaning-1) will send my(God's) person [who takes messages to people] in-front-of you(Christ). (literal) And that person/messenger will prepare-B your(Christ's) path." (dynamic) And that person/messenger will say/announce [you(Christ) are coming]."
`.trim()

export function build_system_instruction(): string {
	return `
		You convert natural-language English text, typically a Bible verse, into TBTA Phase 1 encoding -- the
		notation editor's checker validates.

		${WORKED_EXAMPLE}

		Conventions:
		- Replace third-person pronouns with the noun they refer to; where a pronoun is kept, annotate its
			referent in parentheses, e.g. "you(Christ)", "my(God's)", "We(X)". (Check for "it" apart from an
			agent clause)
		- One verb per clause. Subordinate, relative, and complement clauses go in square brackets [...].
			(Flag two verbs within the same sentence)
		- Imperative clauses need an explicit subject plus the "(imp)" notation, e.g. "You(X) (imp) listen to
			me." (Check for a missing subject before an imperative)
		- A passive verb requires an explicit "by X" agent, or "_implicitActiveAgent" if none is stated.
			(Expect an agent of a passive)
		- "Let's V" becomes "We(X) V _suggestiveLets", not "Let us V". (Suggest '(jussive)' or '_suggestiveLets'
			instead of 'Let')
		- "each-other" is hyphenated. (each other must be hyphenated)
		- Prefer "at that place" / "at this place" over "there" / "here" for clarity.
		- Word senses are suffixed -A through -Z, e.g. "write-C", "tell-D", "prepare-B". Omit the suffix when
			the default sense is intended.
		- The only allowed clause notations are: ${CLAUSE_NOTATIONS.join(', ')}.

		Return only the requested JSON. "phase_1" must be a single line with no markdown fences or commentary.
	`.trim()
}

export function build_repair_instruction({ previous_attempt, feedback }: { previous_attempt: string, feedback: CheckerFeedback[] }): string {
	const feedback_lines = feedback.map(({ token, label, message }) => `- [${label}] near "${token}": ${message}`).join('\n')

	return `
		Your previous Phase 1 encoding did not pass the checker:

		${previous_attempt}

		Checker feedback:
		${feedback_lines}

		Produce a corrected "phase_1" that resolves this feedback while still following the conventions from the
		system instruction.
	`.trim()
}
