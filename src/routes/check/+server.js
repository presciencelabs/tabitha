import { backtranslate } from '$lib/backtranslator'
import { parse } from '$lib/parser'
import { RULES } from '$lib/rules'
import { apply_rules } from '$lib/rules/rules_processor'
import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ url: { searchParams } }) {
	/** @type {string} */
	const text = searchParams.get('text') ?? ''

	const sentences = await parse(text)
	const checked_sentences = apply_rules(sentences, RULES.CHECKER)
	const tokens = simplify_tokens(checked_sentences)

	const back_translation = backtranslate(sentences)

	return response({ status: get_status(tokens), tokens, back_translation })

	/** @param {CheckResponse} result  */
	function response(result) {
		return json(result)
	}
}

/**
 * 
 * @param {SimpleToken[]} tokens 
 * @returns {CheckStatus}
 */
function get_status(tokens) {
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

/**
 * 
 * @param {SimpleToken} token 
 * @returns {SimpleToken[]}
 */
function expand_token(token) {
	if (token.complex_pairing) {
		return [token, token.complex_pairing]
	} else if (token.pronoun) {
		return [token, token.pronoun]
	} else if (token.sub_tokens.length) {
		return [token, ...token.sub_tokens.flatMap(expand_token)]
	} else {
		return [token]
	}
}

/**
 * 
 * @param {Sentence[]} sentences 
 * @returns {SimpleToken[]}
 */
function simplify_tokens(sentences) {
	return sentences.map(({ clause }) => simplify_token(clause))

	/**
	 * 
	 * @param {Token} token 
	 * @returns {SimpleToken}
	 */
	function simplify_token({ token, type, tag, messages, lookup_results, complex_pairing, pronoun, sub_tokens }) {
		return {
			token,
			type,
			tag,
			messages: messages.toSorted((a, b) => a.severity - b.severity),
			lookup_results: lookup_results.map(simplify_lookup),
			complex_pairing: complex_pairing ? simplify_token(complex_pairing) : null,
			pronoun: pronoun ? simplify_token(pronoun) : null,
			sub_tokens: sub_tokens.map(simplify_token),
		}
	}

	/**
	 * 
	 * @param {LookupResult} lookup 
	 * @returns {SimpleLookupResult}
	 */
	function simplify_lookup({ lexicon_id, ontology_id, stem, part_of_speech, sense, form, level, gloss, categorization, how_to_entries, case_frame }) {
		return {
			lexicon_id,
			ontology_id,
			stem,
			part_of_speech,
			sense,
			form,
			level,
			gloss,
			categorization,
			how_to_entries,
			case_frame: simplify_case_frame(case_frame),
		}
	}

	/**
	 * 
	 * @param {CaseFrameResult} case_frame 
	 * @returns {SimpleCaseFrameResult}
	 */
	function simplify_case_frame({ is_valid, is_checked, valid_arguments, extra_arguments, missing_arguments }) {
		return {
			is_valid,
			is_checked,
			valid_arguments: valid_arguments.reduce(simplify_argument_result, {}),
			extra_arguments: extra_arguments.reduce(simplify_argument_result, {}),
			missing_arguments: missing_arguments.map(rule => rule.role_tag),
		}

		/**
		 * 
		 * @param {SimpleRoleArgResult} result 
		 * @param {RoleMatchResult} match 
		 */
		function simplify_argument_result(result, match) {
			const { trigger_token } = match.trigger_context
			return {
				...result,
				[match.role_tag]: trigger_token.lookup_results.at(0)?.stem ?? trigger_token.token,
			}
		}
	}
}