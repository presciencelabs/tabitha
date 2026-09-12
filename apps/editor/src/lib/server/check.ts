import { backtranslate } from '$lib/backtranslator'
import { parse } from '$lib/parser'
import { RULES } from '$lib/rules'
import { apply_rules } from '$lib/rules/rules_processor'

import type {
	EditorCheckResult,
	CheckStatus,
	CheckerMessage,
	CheckerCaseFrameInfo,
	CheckerLookupResult,
	CheckerToken,
} from '@tabitha/types'
import type { CaseFrame, RoleMatchResult, RoleTag } from '$lib/rules/case_frame/types'
import type { LookupResult, Sentence, Token } from '$lib/types'

export async function run_check(text: string): Promise<EditorCheckResult> {
	const sentences = await parse(text)
	const checked_sentences = apply_rules({ sentences, rules: RULES.CHECKER })
	const tokens = simplify_tokens(checked_sentences)

	const back_translation = backtranslate(sentences)

	return { status: get_status(tokens), tokens, back_translation }
}

export function get_status(tokens: CheckerToken[]): CheckStatus {
	const all_messages = tokens.flatMap(expand_token).flatMap(token => token.messages)
	const has_error = all_messages.some(msg => msg.label === 'error')
	const has_warning = all_messages.some(msg => msg.label === 'warning')

	if (has_error) {
		return 'error'
	} else if (has_warning) {
		return 'warning'
	}

	return 'ok'
}

export function expand_token(token: CheckerToken): CheckerToken[] {
	if (token.pairing) {
		return [token, token.pairing]
	} else if (token.pronoun) {
		return [token, token.pronoun]
	} else if (token.sub_tokens.length) {
		return [token, ...token.sub_tokens.flatMap(expand_token)]
	} else {
		return [token]
	}
}

function simplify_tokens(sentences: Sentence[]): CheckerToken[] {
	return sentences.map(({ clause }) => simplify_token(clause))

	function simplify_token({ token, type, tag, messages, lookup_results, pairing, pairing_type, pronoun, sub_tokens, applied_rules }: Token): CheckerToken {
		return {
			token,
			type,
			tag,
			messages: messages.toSorted((a: CheckerMessage, b: CheckerMessage) => a.severity - b.severity),
			lookup_results: lookup_results.map(simplify_lookup),
			pairing: pairing ? simplify_token(pairing) : null,
			pairing_type,
			pronoun: pronoun ? simplify_token(pronoun) : null,
			sub_tokens: sub_tokens.map(simplify_token),
			applied_rules,
		}
	}

	function simplify_lookup({ stem, part_of_speech, sense, form, level, gloss, categorization, ontology_status, how_to_entries, case_frame }: LookupResult): CheckerLookupResult {
		return {
			stem,
			part_of_speech,
			sense,
			form,
			level,
			gloss,
			categorization,
			ontology_status,
			how_to_entries,
			case_frame: simplify_case_frame(case_frame),
		}
	}

	function simplify_case_frame({ usage: { possible_roles, required_roles }, result: { status, valid_arguments, extra_arguments, missing_arguments } }: CaseFrame): CheckerCaseFrameInfo {
		return {
			status,
			valid_arguments: valid_arguments.reduce(simplify_argument_result, {}),
			extra_arguments: extra_arguments.reduce(simplify_argument_result, {}),
			missing_arguments,
			possible_roles,
			required_roles,
		}

		function simplify_argument_result(result: Record<RoleTag, string>, match: RoleMatchResult) {
			const { trigger_token } = match.trigger_context
			return {
				...result,
				[match.role_tag]: trigger_token.lookup_results.at(0)?.stem ?? trigger_token.token,
			}
		}
	}
}
