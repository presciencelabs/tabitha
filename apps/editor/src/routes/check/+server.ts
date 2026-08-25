import { backtranslate } from '$lib/backtranslator'
import { parse } from '$lib/parser'
import { RULES } from '$lib/rules'
import { apply_rules } from '$lib/rules/rules_processor'
import { json } from '@sveltejs/kit'

import type { RequestEvent } from './$types'
import type {
	CheckResponse,
	CheckStatus,
	Message,
	SimpleCaseFrame,
	SimpleLookupResult,
	SimpleRoleArgResult,
	SimpleToken,
} from '@tabitha/types'
import type { CaseFrame, RoleMatchResult } from '$lib/rules/case_frame/types'
import type { LookupResult, Sentence, Token } from '$lib/types'

export async function GET({ url: { searchParams } }: RequestEvent) {
	const text = searchParams.get('text') ?? ''

	const sentences = await parse(text)
	const checked_sentences = apply_rules({ sentences, rules: RULES.CHECKER })
	const tokens = simplify_tokens(checked_sentences)

	const back_translation = backtranslate(sentences)

	return response({ status: get_status(tokens), tokens, back_translation })

	function response(result: CheckResponse) {
		return json(result)
	}
}

function get_status(tokens: SimpleToken[]): CheckStatus {
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

function expand_token(token: SimpleToken): SimpleToken[] {
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

function simplify_tokens(sentences: Sentence[]): SimpleToken[] {
	return sentences.map(({ clause }) => simplify_token(clause))

	function simplify_token({ token, type, tag, messages, lookup_results, pairing, pairing_type, pronoun, sub_tokens, applied_rules }: Token): SimpleToken {
		return {
			token,
			type,
			tag,
			messages: messages.toSorted((a: Message, b: Message) => a.severity - b.severity),
			lookup_results: lookup_results.map(simplify_lookup),
			pairing: pairing ? simplify_token(pairing) : null,
			pairing_type,
			pronoun: pronoun ? simplify_token(pronoun) : null,
			sub_tokens: sub_tokens.map(simplify_token),
			applied_rules,
		}
	}

	function simplify_lookup({ stem, part_of_speech, sense, form, level, gloss, categorization, ontology_status, how_to_entries, case_frame }: LookupResult): SimpleLookupResult {
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

	function simplify_case_frame({ usage: { possible_roles, required_roles }, result: { status, valid_arguments, extra_arguments, missing_arguments } }: CaseFrame): SimpleCaseFrame {
		return {
			status,
			valid_arguments: valid_arguments.reduce(simplify_argument_result, {} as SimpleRoleArgResult),
			extra_arguments: extra_arguments.reduce(simplify_argument_result, {} as SimpleRoleArgResult),
			missing_arguments,
			possible_roles,
			required_roles,
		}

		function simplify_argument_result(result: SimpleRoleArgResult, match: RoleMatchResult) {
			const { trigger_token } = match.trigger_context
			return {
				...result,
				[match.role_tag]: trigger_token.lookup_results.at(0)?.stem ?? trigger_token.token,
			}
		}
	}
}