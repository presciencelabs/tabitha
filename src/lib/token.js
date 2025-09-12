import { LOOKUP_FILTERS } from '$lib/lookup_filters'
import { REGEXES } from '$lib/regexes'

/** @type { { [key: string]: TokenType } } */
export const TOKEN_TYPE = {
	PUNCTUATION: 'Punctuation',
	NOTE: 'Note',
	FUNCTION_WORD: 'FunctionWord',
	LOOKUP_WORD: 'Word',
	CLAUSE: 'Clause',
	ADDED: 'Added',
	PHRASE: 'Phrase',
}

/** @type { { [key: string]: MessageType } } */
export const MESSAGE_TYPE = {
	ERROR: { label: 'error', severity: 0 },
	WARNING: { label: 'warning', severity: 1 },
	SUGGEST: { label: 'suggest', severity: 2 },
	INFO: { label: 'info', severity: 3 },
}

/**
 * @param {string} token
 * @param {TokenType} type
 * @param {Object} [other_data={}]
 * @param {Message?} [other_data.message=null]
 * @param {Tag} [other_data.tag={}]
 * @param {string} [other_data.specified_sense='']
 * @param {string} [other_data.lookup_term='']
 * @param {LookupResult[]} [other_data.lookup_results=[]]
 * @param {Token[]} [other_data.sub_tokens=[]]
 * @param {Token?} [other_data.pairing=null]
 * @param {PairingType} [other_data.pairing_type='none']
 * @param {Token?} [other_data.pronoun=null]
 * @param {string?} [other_data.rule_info=null]
 * @return {Token}
 */
export function create_token(token, type, { message=null, tag={}, specified_sense='', lookup_term='', lookup_results=[], sub_tokens=[], pairing=null, pairing_type='none', pronoun=null, rule_info=null }={}) {
	return {
		token,
		type,
		messages: message ? [message] : [],
		tag,
		specified_sense,
		lookup_terms: lookup_term ? [lookup_term] : [],
		lookup_results,
		sub_tokens,
		pairing,
		pairing_type,
		pronoun,
		applied_rules: rule_info ? [rule_info] : [],
	}
}

/**
 * @param {string} token
 * @param {Message} message
 * @param {string?} rule_id
 * @returns {Token}
 */
export function create_added_token(token, message, rule_id=null) {
	const rule_info = rule_id ? `add - ${rule_id}` : null
	return create_token(token, TOKEN_TYPE.ADDED, { message, rule_info })
}

/**
 * @param {Token[]} sub_tokens
 * @param {Tag} tag
 */
export function create_clause_token(sub_tokens, tag={ 'clause_type': 'subordinate_clause' }) {
	return create_token('', TOKEN_TYPE.CLAUSE, { sub_tokens, tag })
}

/**
 * @param {MessageLabel} label
 * @returns {MessageType}
 */
export function get_message_type(label) {
	// @ts-expect-error label will never be undefined
	return Object.values(MESSAGE_TYPE).find(message_type => message_type.label === label)
}

/**
 * Set the message on the given token in the message info, or the trigger token by default.
 * The message will be formatted based on the given token and the token context values within the rule context.
 *
 * @param {RuleTriggerContext} trigger_context
 * @param {MessageInfo} message_info
 */
export function set_message(trigger_context, message_info) {
	const token_to_flag = message_info.token_to_flag ?? trigger_context.trigger_token

	const message_type = Object.values(MESSAGE_TYPE).find(message_type => message_type.label in message_info)
	const message_text = message_type ? message_info[message_type.label] : undefined
	if (!message_text || !message_type) {
		return
	}

	const message = {
		...message_type,
		message: message_info.plain ? message_text : format_token_message(trigger_context, message_text, token_to_flag),
	}
	set_message_plain(token_to_flag, message, trigger_context.rule_id)
}

/**
 * Set the message on the given token. No formatting is performed.
 *
 * @param {Token} token
 * @param {Message} message
 * @param {string} rule_id
 */
export function set_message_plain(token, message, rule_id) {
	token.messages.push(message)
	token.applied_rules.push(`message:${message.label} - ${rule_id}`)
}

/**
 * Format the message based on the trigger token or the given token if provided.
 * The message will also be formatted based on the token context values within the rule context.
 * TODO support markers for subtokens?
 *
 * @param {RuleTriggerContext} trigger_context
 * @param {string} message
 * @param {Token} token
 */
export function format_token_message({ tokens, trigger_token, context_indexes }, message, token=trigger_token) {
	return context_indexes.reduce(replace_context_markers, replace_markers(message, token))

	/**
	 * @param {string} text
	 * @param {number} token_index
	 * @param {number} context_number
	 */
	function replace_context_markers(text, token_index, context_number) {
		return replace_markers(text, tokens[token_index], `${context_number}:`)
	}

	/**
	 * @param {string} text
	 * @param {Token} token
	 * @param {string} context_prefix
	 */
	function replace_markers(text, token, context_prefix='') {
		const result = token.lookup_results.at(0)
		const stem = result?.stem ?? token.token
		return text
			.replaceAll(`{${context_prefix}stem}`, stem)
			.replaceAll(`{${context_prefix}token}`, token.token)
			.replaceAll(`{${context_prefix}category}`, result?.part_of_speech ?? 'word')
			.replaceAll(`{${context_prefix}sense}`, result ? stem_with_sense(result) : stem)
	}
}

/**
 *
 * @param {TokenBase} token
 * @returns {boolean}
 */
export function token_has_error(token) {
	return token_has_message(token, 'error')
}

/**
 *
 * @param {TokenBase} token
 * @param {MessageLabel?} type_to_check
 * @returns {boolean}
 */
export function token_has_message(token, type_to_check=null) {
	return type_to_check
		? token.messages.some(({ label }) => label === type_to_check)
		: token.messages.length > 0
}

/**
 *
 * @param {Token} token
 * @returns {boolean}
 */
export function is_one_part_of_speech(token) {
	const part_of_speech_0 = token.lookup_results.at(0)?.part_of_speech ?? ''
	return token.lookup_results.every(LOOKUP_FILTERS.IS_PART_OF_SPEECH(part_of_speech_0))
}

/**
 *
 * @param {string} term
 * @returns {{stem: string, sense: string}}
 */
export function split_stem_and_sense(term) {
	/** @type {RegExpMatchArray} */
	// @ts-expect-error the match will always succeed
	const match = term.match(REGEXES.EXTRACT_STEM_AND_SENSE)
	return { stem: match[1], sense: match[2] ?? '' }
}

/**
 *
 * @param {Token} token
 * @param {Tag} tag
 * @param {string} [rule_id='Unknown'] 
 */
export function add_tag_to_token(token, tag, rule_id='Unknown') {
	token.tag = { ...token.tag, ...tag }
	token.applied_rules.push(`tag:${Object.keys(tag).join('|')} - ${rule_id}`)
}

/**
 * This checks if there is any value for a specific key, or if any of the given values
 * are present for the specified keys.
 *
 * @param {Token} token
 * @param {Tag | string | (Tag | string)[]} tag_to_check
 * @returns {boolean}
 */
export function token_has_tag(token, tag_to_check) {
	if (Array.isArray(tag_to_check)) {
		return tag_to_check.some(tag => token_has_tag(token, tag))
	}
	if (typeof tag_to_check === 'string') {
		const filter_keys = tag_to_check.split('|')
		return filter_keys.some(key => token.tag[key]?.length > 0 )
	}
	return Object.entries(tag_to_check).every(([key, value]) => {
		const filter_values = value.split('|')
		const tag_values = token.tag[key]?.split('|') ?? []
		return tag_values.some(tag => filter_values.includes(tag))
	})
}

/**
 *
 * @param {Token} token
 * @returns {Token[]}
 */
export function flatten_token(token) {
	if (token.type === TOKEN_TYPE.CLAUSE) {
		return token.sub_tokens.flatMap(flatten_token)
	}
	return [token]
}

/**
 *
 * @param {Sentence} sentence
 * @returns {Token[]}
 */
export function flatten_sentence(sentence) {
	return flatten_token(sentence.clause)
}

/**
 * @param {{stem: string, sense: string}} result
 * @returns {string}
 */
export function stem_with_sense(result) {
	return result.sense.length ? `${result.stem}-${result.sense}` : result.stem
}

/**
 *
 * @param {{ stem: string, part_of_speech: string }} lookup
 * @param {Object} [other_data={}]
 * @param {string} [other_data.form='']
 * @param {string} [other_data.sense='']
 * @param {number} [other_data.level=-1]
 * @param {string} [other_data.gloss='']
 * @param {string} [other_data.categorization='']
 * @param {HowToEntry[]} [other_data.how_to=[]]
 * @param {CaseFrameResult?} [other_data.case_frame=null]
 * @param {OntologyStatus} [other_data.ontology_status='unknown']
 * @returns {LookupResult}
 */
export function create_lookup_result(
	{ stem, part_of_speech },
	{ form='stem', sense='', level=-1, gloss='', categorization='', how_to=[], case_frame=null, ontology_status='unknown' }={},
) {
	return {
		stem,
		part_of_speech,
		form: form.toLowerCase(),
		sense,
		level,
		gloss,
		categorization,
		ontology_status,
		how_to_entries: how_to,
		case_frame: {
			rules: [],
			usage: {
				possible_roles: [],
				required_roles: [],
			},
			result: case_frame ?? create_case_frame(),
		},
	}
}

/**
 *
 * @param {Object} [data={}]
 * @param {CaseFrameStatus} [data.status='unchecked']
 * @param {RoleMatchResult[]} [data.valid_arguments=[]]
 * @param {RoleMatchResult[]} [data.extra_arguments=[]]
 * @param {RoleTag[]} [data.missing_arguments=[]]
 * @returns {CaseFrameResult}
 */
export function create_case_frame({ status='unchecked', valid_arguments=[], extra_arguments=[], missing_arguments=[] }={}) {
	return {
		status,
		valid_arguments,
		extra_arguments,
		missing_arguments,
	}
}
