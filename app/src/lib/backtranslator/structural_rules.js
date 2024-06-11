import { TOKEN_TYPE, create_token } from '$lib/parser/token'
import { REGEXES } from '$lib/regexes'
import { create_context_filter, create_skip_filter, create_token_filter, simple_rule_action } from '$lib/rules/rules_parser'

/** @type {BuiltInRule[]} */
const structural_rules_json = [
	{
		name: 'Imperatives',
		comment: '',
		rule: {
			trigger: create_token_filter({ 'token': '(imp)' }),
			context: create_context_filter({
				'precededby': { 'tag': { 'pronoun': 'second_person' } },
			}),
			action: ({ tokens, trigger_index, context_indexes }) => {
				// Fix capitalization if necessary
				if (is_first_word(tokens[context_indexes[0]]) && tokens.length > trigger_index + 1) {
					const next_word = tokens[trigger_index + 1]
					next_word.token = capitalize_token(next_word)
				}

				tokens.splice(context_indexes[0], 2)	// remove the You() (imp)
				return trigger_index - 1	// remove 2 tokens and move forward one
			},
		},
	},
	{
		name: 'insert "that" into some "patient_clause_different_participant" clauses',
		comment: '',
		rule: {
			trigger: create_token_filter({ 'tag': { 'clause_type': 'patient_clause_different_participant' } }),
			context: create_context_filter({ }),
			action: simple_rule_action(({ trigger_token }) => {
				// Don't add that if the patient clause includes an infinitive 'to'
				if (trigger_token.sub_tokens.some(create_token_filter({ 'tag': { 'syntax': 'infinitive' } }))) {
					return
				}

				trigger_token.sub_tokens.splice(1, 0, create_token('that', TOKEN_TYPE.FUNCTION_WORD))
			}),
		},
	},
	{
		name: 'Add commas around descriptive relative clauses, headed by level 4 words',
		comment: '',
		rule: {
			trigger: create_token_filter({ 'tag': { 'clause_type': 'relative_clause' } }),
			context: create_context_filter({ 'precededby': { 'category': 'Noun', 'level': '4' } }),
			action: simple_rule_action(({ trigger_token }) => {
				trigger_token.sub_tokens = [
					create_token(',', TOKEN_TYPE.PUNCTUATION),
					...trigger_token.sub_tokens,
					create_token(',', TOKEN_TYPE.PUNCTUATION),
				]
			}),
		},
	},
	{
		name: 'Add commas around relative clauses marked with _descriptive',
		comment: '',
		rule: {
			trigger: create_token_filter({ 'tag': { 'clause_type': 'relative_clause' } }),
			context: create_context_filter({ 'subtokens': { 'token': '_descriptive', 'skip': 'all' } }),
			action: simple_rule_action(({ trigger_token }) => {
				trigger_token.sub_tokens = [
					create_token(',', TOKEN_TYPE.PUNCTUATION),
					...trigger_token.sub_tokens,
					create_token(',', TOKEN_TYPE.PUNCTUATION),
				]
			}),
		},
	},
	{
		name: 'Change "tribe//region//city//town//country//place named Y" -> "X of Y"',
		comment: '',
		rule: {
			trigger: create_token_filter({ 'tag': { 'relation': 'name' } }),
			context: create_context_filter({
				'precededby': { 'stem': 'tribe|region|city|town|country' },
			}),
			action: simple_rule_action(({ trigger_token }) => {
				trigger_token.token = 'of'
			}),
		},
	},
	{
		name: 'Explain name',
		comment: 'The noun phrases get switched around. eg "...at Baal-Peor named a place _explainName" -> "at <<a place named>> Baal-Peor',
		rule: {
			trigger: create_token_filter({ 'token': '_explainName|_implicitExplainName' }),
			context: create_context_filter({
				'precededby': [
					{ 'type': TOKEN_TYPE.LOOKUP_WORD },
					{ 'tag': { 'relation': 'name' }, 'skip': 'np_modifiers' },
					{ 'category': 'Noun' },
				],
			}),
			action: ({ tokens, trigger_index, context_indexes }) => {
				const [noun1_index, named_index, noun2_index] = context_indexes

				const explicit_phrase_start = find_phrase_start('Noun', tokens, noun1_index)
				const explicit_phrase = tokens.slice(explicit_phrase_start, named_index)
				const implicit_phrase = tokens.slice(named_index + 1, noun2_index + 1)

				// Fix capitalization if necessary
				if (is_first_word(explicit_phrase[0])) {
					implicit_phrase[0].token = capitalize_token(implicit_phrase[0])
				}

				tokens.splice(explicit_phrase_start, trigger_index - explicit_phrase_start + 1, ...[
					create_token('<<', TOKEN_TYPE.PUNCTUATION),
					...implicit_phrase,
					tokens[named_index],
					create_token('>>', TOKEN_TYPE.PUNCTUATION),
					...explicit_phrase,
				])

				return trigger_index + 3	// add 2 and move forward 1
			},
		},
	},
	{
		name: 'Literal and dynamic expansion and metonymy',
		comment: 'The noun phrases get switched around. eg "The Lord of the eyes _literalExpansion..." -> "<<The eyes of>> the Lord...',
		rule: {
			trigger: create_token_filter({ 'token': '_literalExpansion|_dynamicExpansion|_metonymy' }),
			context: create_context_filter({
				'precededby': [
					{ 'category': 'Noun', 'skip': 'np_modifiers' },
					{ 'token': 'of', 'skip': 'np_modifiers' },
					{ 'category': 'Noun' },
				],
			}),
			action: ({ tokens, trigger_index, context_indexes }) => {
				const [noun1_index, of_index, noun2_index] = context_indexes

				const explicit_phrase_start = find_phrase_start('Noun', tokens, noun1_index)
				const explicit_phrase = tokens.slice(explicit_phrase_start, of_index)
				const implicit_phrase = tokens.slice(of_index + 1, noun2_index + 1)

				// Fix capitalization if necessary
				if (is_first_word(explicit_phrase[0])) {
					explicit_phrase[0].token = decapitalize_token(explicit_phrase[0])
					implicit_phrase[0].token = capitalize_token(implicit_phrase[0])
				}

				tokens.splice(explicit_phrase_start, trigger_index - explicit_phrase_start, ...[
					create_token('<<', TOKEN_TYPE.PUNCTUATION),
					...implicit_phrase,
					tokens[of_index],
					create_token('>>', TOKEN_TYPE.PUNCTUATION),
					...explicit_phrase,
				])

				return trigger_index + 3	// add 2 and move forward 1
			},
		},
	},
	{
		name: 'Add <<>> around implicit clauses',
		comment: '',
		rule: {
			trigger: create_token_filter({ 'type': TOKEN_TYPE.CLAUSE }),
			context: create_context_filter({
				'subtokens': {
					'token': '(implicit-situational)|(implicit-background)|(implicit-subaction)|(implicit-cultural)|(implicit-historical)',
					'skip': 'all',
				},
			}),
			action: simple_rule_action(({ trigger_token, subtoken_indexes }) => {
				trigger_token.sub_tokens = [
					create_token('<<', TOKEN_TYPE.PUNCTUATION),
					...trigger_token.sub_tokens.slice(0, subtoken_indexes[0]),
					...trigger_token.sub_tokens.slice(subtoken_indexes[0] + 1),
					create_token('>>', TOKEN_TYPE.PUNCTUATION),
				]
			}),
		},
	},
	{
		name: 'Add <<>> around implicit phrases',
		comment: 'Include any note containing "implicit"',
		rule: {
			trigger: ({ token }) => token.startsWith('_') && token.toLowerCase().includes('implicit'),
			context: create_context_filter({
				'precededby': { 'category': 'Noun|Adjective|Adverb|Verb' },
			}),
			action: ({ tokens, trigger_index, context_indexes }) => {
				const head_category = tokens[context_indexes[0]].lookup_results[0].part_of_speech

				const phrase_start = find_phrase_start(head_category, tokens, context_indexes[0], true)
				const phrase_end = find_phrase_end(head_category, tokens, trigger_index)

				const is_necessary = tokens[trigger_index].token.toLowerCase().includes('necessary')
				tokens.splice(phrase_end, 0, create_token(is_necessary ? '>' : '>>', TOKEN_TYPE.PUNCTUATION))
				tokens.splice(phrase_start, 0, create_token(is_necessary ? '<' : '<<', TOKEN_TYPE.PUNCTUATION))
				return trigger_index + 3	// add 2 behind and move forward 1
			},
		},
	},
	{
		name: "God's book -> the Scriptures",
		comment: '',
		rule: {
			trigger: create_token_filter({ 'token': 'book' }),
			context: create_context_filter({ 'precededby': { 'token': "God's" } }),
			action: simple_rule_action(({ tokens, context_indexes }) => {
				const new_tokens = [
					create_token('the', TOKEN_TYPE.FUNCTION_WORD),
					create_token('Scriptures', TOKEN_TYPE.LOOKUP_WORD),
				]
				tokens.splice(context_indexes[0], 2, ...new_tokens)
				// no need to specify trigger_index because no net tokens are changed
			}),
		},
	},
	{
		name: 'Simple text mappings',
		comment: '',
		rule: {
			trigger: token => TOKEN_TEXT_MAP.has(token.token),
			context: create_context_filter({ }),
			action: simple_rule_action(({ trigger_token }) => {
				trigger_token.token = TOKEN_TEXT_MAP.get(trigger_token.token) ?? trigger_token.token
			}),
		},
	},
]

/**
 * @typedef {{ pre_head: any[], other_pre_relations: any[], post_head: any[] }} PhraseFilters
 * @type {Map<string, PhraseFilters>}
 */
const PHRASE_FILTERS = new Map([
	['Noun', {
		pre_head: [
			// The 'np' skip filter includes 'of' and 'named' relations, but we don't want those here
			{ 'tag': ['determiner', { 'relation': 'genitive_saxon' }] },
			'adjp_attributive',
			{ 'category': 'Noun' },
		],
		other_pre_relations: [
			{ 'category': 'Adposition' },
			{ 'tag': 'relation' },	// 'of' or 'named'
			{ 'tag': { 'syntax': 'agent_of_passive|argument_adposition' } },	// 'by'
		],
		post_head: [
			{ 'tag': { 'clause_type': 'relative_clause' } },
		],
	}],
	['Adjective', {
		pre_head: ['adjp_modifiers_attributive'],
		other_pre_relations: [],
		post_head: [],
	}],
	['Adverb', {
		pre_head: ['advp_modifiers'],
		other_pre_relations: [],
		post_head: [],
	}],
	['Verb', {
		pre_head: [
			{ 'tag': 'verb_polarity|modal|auxiliary' },
			{ 'tag': { 'syntax': 'infinitive' } },
		],
		other_pre_relations: [],
		post_head: [],
	}],
])

const TOKEN_TEXT_MAP = new Map([
	['_paragraph', '(paragraph)'],
	['2', 'two'],
	['3', 'three'],
	['4', 'four'],
	['5', 'five'],
])

/**
 * 
 * @param {string} part_of_speech 
 * @param {Token[]} tokens 
 * @param {number} head_index 
 * @param {boolean} [include_relation=false] 
 */
function find_phrase_start(part_of_speech, tokens, head_index, include_relation=false) {
	const phrase_filters = PHRASE_FILTERS.get(part_of_speech)

	const pre_head_filters = create_skip_filter(phrase_filters?.pre_head ?? [])
	const phrase_start = tokens.findLastIndex((token, index) => index < head_index && !pre_head_filters(token)) + 1
	
	if (!include_relation) {
		return phrase_start
	}

	// include an adposition/relation if present
	const other_pre_filters = phrase_filters?.other_pre_relations.map(create_token_filter) ?? []
	if (phrase_start > 0 && other_pre_filters.some(filter => filter(tokens[phrase_start-1]))) {
		return phrase_start - 1
	}
	return phrase_start
}

/**
 * 
 * @param {string} part_of_speech 
 * @param {Token[]} tokens 
 * @param {number} head_index 
 */
function find_phrase_end(part_of_speech, tokens, head_index) {
	const post_head_filters = create_skip_filter(PHRASE_FILTERS.get(part_of_speech)?.post_head ?? [])
	let phrase_end = tokens.findIndex((token, index) => index > head_index && !post_head_filters(token))
	return phrase_end === -1 ? head_index + 1 : phrase_end
}

/**
 * 
 * @param {Token} token 
 * @returns {string}
 */
function decapitalize_token(token) {
	if (create_token_filter({ 'level': '4' })(token)) {
		return token.token
	}
	return `${token.token[0].toLowerCase()}${token.token.slice(1)}`
}

/**
 * 
 * @param {Token} token 
 * @returns {string}
 */
function capitalize_token({ token }) {
	if (REGEXES.STARTS_LOWERCASE.test(token)) {
		return `${token[0].toUpperCase()}${token.slice(1)}`
	}
	return token
}

/**
 * 
 * @param {Token} token
 */
function is_first_word(token) {
	return create_token_filter({ 'tag': { 'position': 'first_word' } })(token)
}


export const BT_STRUCTURAL_RULES = structural_rules_json.map(({ rule }) => rule)