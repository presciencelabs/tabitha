import { backtranslate } from '$lib/backtranslator'
import { parse } from '$lib/parser'
import { concept_with_sense, token_has_error } from '$lib/parser/token'
import { json } from '@sveltejs/kit'


/** @type {import('./$types').RequestHandler} */
export async function GET({ url: { searchParams }, locals: { db } }) {
	/** @type {string} */
	const text = searchParams.get('text') ?? ''

	const sentences = await parse(text, db)
	const tokens = simplify_tokens(sentences)

	// TODO use tokens to generate back translation
	const back_translation = backtranslate(text)

	return response({ has_error: has_error(tokens), tokens, back_translation })

	/** @param {CheckResponse} result  */
	function response(result) {
		return json(result)
	}
}

/**
 * 
 * @param {SimpleToken[]} tokens 
 * @returns {boolean}
 */
function has_error(tokens) {
	return tokens.some(token => token_has_error(token)
		|| token.complex_pairing && token_has_error(token.complex_pairing)
		|| token.pronoun && token_has_error(token.pronoun)
		|| has_error(token.sub_tokens))
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
	function simplify_lookup(lookup) {
		return {
			concept: lookup.concept ? concept_with_sense(lookup.concept) : lookup.stem,
			part_of_speech: lookup.part_of_speech,
			form: lookup.form,
			level: lookup.concept?.level ?? -1,
			gloss: lookup.concept?.gloss ?? '',
			categorization: lookup.concept?.categorization ?? '',
			how_to_hints: lookup.how_to.map(simplify_how_to),
			case_frame: simplify_case_frame(lookup.case_frame),
		}
	}

	/**
	 * 
	 * @param {HowToResult} how_to 
	 * @returns {SimpleHowToResult}
	 */
	function simplify_how_to({ structure, pairing, explication }) {
		return { structure, pairing, explication }
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
			valid_arguments: valid_arguments.map(match => match.role_tag),
			extra_arguments: extra_arguments.map(match => match.role_tag),
			missing_arguments: missing_arguments.map(rule => rule.role_tag),
		}
	}
}