import { TOKEN_TYPE } from '$lib/parser/token'
import { pipe } from '$lib/pipeline'
import { rules_applier } from '$lib/rules'
import { phrasify } from './phrasify'
import { BT_STRUCTURAL_RULES } from './structural_rules'

/**
 * 
 * @param {Sentence[]} sentences 
 * @return {string}
 */
export function backtranslate(sentences) {
	return pipe(
		phrasify,
		rules_applier(BT_STRUCTURAL_RULES),
		textify,
		find_replace,
	)(sentences)
}

/**
 * 
 * @param {Sentence[]} sentences 
 * @returns {string}
 */
export function textify(sentences) {
	return textify_tokens(sentences.map(sentence => sentence.clause))

	/**
	 * 
	 * @param {Token[]} tokens 
	 * @returns {string}
	 */
	function textify_tokens(tokens) {
		return tokens.map(textify_token).filter(text => text).join(' ')
	}

	/**
	 * 
	 * @param {Token} token 
	 * @returns {string}
	 */
	function textify_token(token) {
		if (token.sub_tokens.length) {
			return textify_tokens(token.sub_tokens)
		} else if (token.complex_pairing) {
			return textify_token(token.complex_pairing)
		} else if (token.pronoun) {
			return textify_token(token.pronoun)
		} else if (token.type === TOKEN_TYPE.ADDED) {
			return ''
		} else if (token.type === TOKEN_TYPE.PHRASE) {
			return ''
		} else if (token.token.startsWith('_')) {
			return ''
		} else if (['[', ']'].includes(token.token)) {
			return ''
		} else if (token.specified_sense) {
			// remove the sense from the token
			return token.token.replace(/-[A-Z]$/, '')
		} else {
			return token.token
		}
	}
}

/**
 * 
 * @param {string} text 
 * @returns {string}
 */
export function find_replace(text) {
	return text
		// remove all hyphens within words
		.replace(/(\w)-(\w)/g, '$1 $2')
		// remove both spaces around hyphen (found in verse references)
		.replace(/ - /g, '-')
		// always remove spaces before certain punctuation
		.replace(/ ([.,:?!>])/g, '$1')
		// always remove spaces after some punctuation
		.replace(/< /g, '<')
		// remove spaces after a verse-reference colon
		.replace(/(\d:) (\d)/g, '$1$2')
		// remove comma before other punctuation
		.replace(/,([,.:?!])/g, '$1')
		// remove spaces after opening quotes
		.replace(/, " /g, ', "')
		// remove spaces before closing quotes
		.replace(/([.?!]) "/g, '$1"')
		// remove neighboring implicit markers
		.replace(/>> <</g, ' ')
		.replace(/([^>])> <([^<])/g, '$1 $2')
}