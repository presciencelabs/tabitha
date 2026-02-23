import { create_token_filter } from '$lib/rules/rules_parser'
import { create_lookup_result, TOKEN_TYPE } from '$lib/token'

/** @type {[string, TokenFilter][]} */
const PUNCTUATION_PARTICLES = [
	['exclamation', create_token_filter({ 'token': '!' })],
	['-QuoteBegin', create_token_filter({ 'token': '"', 'tag': { 'quote': 'begin' } })],
	['-QuoteEnd', create_token_filter({ 'token': '"' })],
	['-CommentBegin', create_token_filter({ 'token': '(comment-begin)|(begin-comment)' })],
	['-CommentEnd', create_token_filter({ 'token': '(comment-end)|(end-comment)' })],
]

/**
 * @param {Sentence[]} sentences 
 * @returns {Sentence[]} 
 */
export function replace_punctuation(sentences) {
	return replace_punctuation_tokens(sentences.map(sentence => sentence.clause)).map(clause => ({ clause }))

	/**
	 * @param {Token[]} tokens 
	 * @returns {Token[]}
	 */
	function replace_punctuation_tokens(tokens) {
		return tokens.map(replace_punctuation_token)
	}

	/**
	 * @param {Token} token 
	 * @returns {Token}
	 */
	function replace_punctuation_token(token) {
		if (token.sub_tokens.length) {
			token.sub_tokens = replace_punctuation_tokens(token.sub_tokens)
			return token
		}
		
		const particle_entry = PUNCTUATION_PARTICLES.find(([, filter]) => filter(token))
		if (particle_entry) {
			const [stem,] = particle_entry
			return {
				...token,
				token: stem,
				type: TOKEN_TYPE.LOOKUP_WORD,
				lookup_results: [create_lookup_result({ stem, part_of_speech: 'Particle' }, { sense: 'A', ontology_status: 'in ontology' })],
			}
		}
		return token
	}
}

/**
 * @param {SimpleSourceEntity[]} entities 
 * @returns {NounListEntry[]}
 */
export function populate_noun_list(entities) {
	/** @type {NounListEntry[]} */
	const noun_list = []

	entities.forEach(entity => {
		if (!entity.concept || entity.concept.part_of_speech !== 'Noun') {
			return
		}
		const current_noun = `${entity.concept.stem}-${entity.concept.sense}`

		const existing = noun_list.filter(({ noun }) => noun === current_noun)
		let noun_list_index = ''
		if (entity.noun_list_index) {
			const index = parseInt(entity.noun_list_index)
			if (index > existing.length) {
				noun_list_index = next_noun_index()
				noun_list.push({ index: noun_list_index, noun: current_noun })
			} else {
				noun_list_index = existing[index-1].index
			}
		} else if (existing.length) {
			noun_list_index = existing[existing.length-1].index
		} else {
			noun_list_index = next_noun_index()
			noun_list.push({ index: noun_list_index, noun: current_noun })
		}

		entity.noun_list_index = noun_list_index
	})

	return noun_list

	/**
	 * @returns {NounListIndex}
	 */
	function next_noun_index() {
		const next = noun_list.length + 1
		if (next >= 10) {
			// index 10 and up use capital letters starting with A (ascii 65)
			return String.fromCharCode(65 + next - 10)
		} else {
			return next.toString()
		}
	}
}