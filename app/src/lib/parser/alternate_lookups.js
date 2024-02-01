import {TOKEN_TYPE, create_token} from './token'

/**
 * @typedef {[token_list: string[], new_lookup: string]} AlternateLookup
 */

/**
 * These words/phrases (and some others) are accepted by the Analyzer as alternates for 
 * certain words in the Ontology.
 * This could easily be put into a config file to prevent the need to rebuild if adding a new one.
 * 
 * @type {AlternateLookup[]}
 */
const ALTERNATE_LOOKUPS = [
	[['in','order','to'], 'in-order-to'],
	[['in','front','of'], 'in-front-of'],
	[['so','that'], 'so-that'],
	[['just','like'], 'just-like'],
	[['even','if'], 'even-if'],
	[['much'], 'much-many'],
	[['many'], 'much-many'],
	[['every'], 'each'],
	[['half'], '.5'],
	[['one','tenth','of'], '.1'],
]

const ALTERNATE_LOOKUPS_OPENING_TOKENS = new Set(ALTERNATE_LOOKUPS.map(alt => alt[0][0]))

/**
 * 
 * @param {Token[]} tokens 
 * @returns {Token[]}
 */
export function use_alternate_lookups(tokens) {
	const new_tokens = []

	let current = 0
	while (current < tokens.length) {
		new_tokens.push(create_next_token())
	}

	return new_tokens

	/**
	 * 
	 * @returns {Token}
	 */
	function create_next_token() {
		if (ALTERNATE_LOOKUPS_OPENING_TOKENS.has(tokens[current].token.toLowerCase())) {
			const alternate = ALTERNATE_LOOKUPS.find(matches_alternate)
			if (alternate) {
				const [token_list, new_lookup] = alternate

				// Use the real token strings to ensure capitalization stays the same
				const slice_end = current + token_list.length
				const combined_tokens = tokens.slice(current, slice_end).map(({token}) => token)
				current = slice_end
				return create_token(combined_tokens.join(' '), TOKEN_TYPE.LOOKUP_WORD, {lookup_term: new_lookup})
			}
		}
		
		return tokens[current++]
	}

	/**
	 * @param {AlternateLookup} alt
	 */
	function matches_alternate([token_list]) {
		return (current + token_list.length) <= tokens.length
			&& token_list.every((value, i) => value == tokens[current+i].token.toLowerCase())
	}
}