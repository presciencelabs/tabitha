import { TOKEN_TYPE } from '$lib/token'
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
		} else if (token.pairing && token.pairing_type === 'complex') {
			// Only show the complex word
			return textify_lookup_word(token.pairing)
		} else if (token.pairing && token.pairing_type === 'literal') {
			// We want to show both the dynamic and literal words for now
			return `${textify_lookup_word(token)}\\${textify_lookup_word(token.pairing)}`
		} else if (token.pronoun) {
			return textify_token(token.pronoun)
		} else if (token.type === TOKEN_TYPE.ADDED) {
			return ''
		} else if (token.type === TOKEN_TYPE.PHRASE) {
			return ''
		} else if (token.type === TOKEN_TYPE.GAP) {
			return ''
		} else if (token.token.startsWith('_')) {
			return ''
		} else if (['[', ']'].includes(token.token)) {
			return ''
		} else if (token.type === TOKEN_TYPE.LOOKUP_WORD) {
			return textify_lookup_word(token)
		} else {
			// Any remaining function words, punctuation, and notes
			return token.token
		}
	}

	/**
	 * @param {Token} token
	 * @returns {string}
	 */
	function textify_lookup_word(token) {
		// Remove the sense from the token and any remaining hyphens
		// We want to keep the hyphen in notes like (poetry-begin) so this is specific to lookup words
		return token.token.replace(/-[A-Z]$/, '').replace(/(\w)-(\w)/g, '$1 $2')
	}
}

/**
 * 
 * @param {string} text 
 * @returns {string}
 */
export function find_replace(text) {
	return text
		// remove both spaces around hyphen (found in verse references)
		.replace(/ - /g, '-')
		// always remove spaces before certain punctuation
		.replace(/ ([.,:?!>)])/g, '$1')
		// always remove spaces after some punctuation
		.replace(/([<(]) /g, '$1')
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