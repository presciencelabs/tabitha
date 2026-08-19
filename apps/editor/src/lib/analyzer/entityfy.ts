import { token_has_tag, TOKEN_TYPE } from '$lib/token'
import { get_features_for_token } from './features'
import type {
	CategoryName,
	EntityFeature,
	PairingType,
	Sentence,
	SimpleSourceEntity,
	SourceConcept,
	Token,
} from '@tabitha/types'

export function entityfy(sentences: Sentence[]): SimpleSourceEntity[] {
	return entityfy_tokens(sentences.map(sentence => sentence.clause))

	function entityfy_tokens(tokens: Token[]): SimpleSourceEntity[] {
		return tokens.flatMap((_, index, tokens) => entityfy_token(tokens, index))
	}

	function entityfy_token(tokens: Token[], token_index: number): SimpleSourceEntity[] {
		const token = tokens[token_index]
		const category = get_token_category(token)
		if (!category) {
			return []
		}

		const features = get_features_for_token(tokens, token_index, category)
		if (category === 'Clause') {
			if (token_has_tag(token, { 'clause_type': 'main_clause' })) {
				return [
					create_source_entity({ category, value: '{', features }),
					...entityfy_tokens(token.sub_tokens),
					create_source_entity({ category: '.', value: '.' }),
					create_source_entity({ value: '}' }),
				]
			} else {
				return [
					create_source_entity({ category, value: '[', features }),
					...entityfy_tokens(token.sub_tokens),
					create_source_entity({ value: ']' }),
				]
			}

		} else if (category.endsWith('Phrase')) {
			// A phrase start
			return [create_source_entity({ category, value: '(', features })]

		} else if (category === 'P_END') {
			// A phrase end
			return [create_source_entity({ value: ')' })]

		} else if (token.lookup_results.length) {
			const concept = convert_to_concept(token)
			const pairing_concept = token.pairing ? convert_to_concept(token.pairing) : null
			const noun_list_index = token.tag['noun_index'] || null
			return [create_source_entity({ category, features, concept, pairing_concept, pairing_type: token.pairing_type, noun_list_index })]

		} else {
			return []
		}
	}

	function convert_to_concept(token: Token): SourceConcept {
		const { stem, sense, part_of_speech } = token.lookup_results[0]
		return { stem, sense, part_of_speech }
	}
}

function create_source_entity({
	category = '',
	value = '',
	features = [],
	concept = null,
	pairing_concept = null,
	pairing_type = 'none',
	noun_list_index = null,
}: {
	category?: CategoryName
	value?: string
	features?: EntityFeature[]
	concept?: SourceConcept | null
	pairing_concept?: SourceConcept | null
	pairing_type?: PairingType
	noun_list_index?: string | null
} = {}): SimpleSourceEntity {
	return {
		category,
		value: value || concept?.stem || '',
		features,
		concept,
		pairing_concept,
		pairing_type,
		noun_list_index: noun_list_index || (category === 'Noun' ? '1' : null),
	}
}

const PHRASE_CATEGORY_MAP: Record<string, string> = {
	'NP': 'Noun Phrase',
	'VP': 'Verb Phrase',
	'AdjP': 'Adjective Phrase',
	'AdvP': 'Adverb Phrase',
}

function get_token_category(token: Token): CategoryName | null {
	if (token.type === TOKEN_TYPE.CLAUSE) {
		return 'Clause'
	} else if (token.type === TOKEN_TYPE.PHRASE && token.token.startsWith('{')) {
		// A phrase start token is in the format like "{NP" or "{AdjP"
		return PHRASE_CATEGORY_MAP[token.token.substring(1)] as CategoryName
	} else if (token.type === TOKEN_TYPE.PHRASE && token.token === '}') {
		return 'P_END' as CategoryName
	} else if (token.lookup_results.length) {
		return token.lookup_results[0].part_of_speech as CategoryName
	} else {
		return null
	}
}