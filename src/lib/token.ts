import { LOOKUP_FILTERS } from '$lib/lookup_filters'
import { REGEXES } from '$lib/regexes'

export const TOKEN_TYPE = {
	PUNCTUATION: 'Punctuation',
	NOTE: 'Note',
	FUNCTION_WORD: 'FunctionWord',
	LOOKUP_WORD: 'Word',
	CLAUSE: 'Clause',
	ADDED: 'Added',
	PHRASE: 'Phrase',
	GAP: 'Gap',
} as const

export const MESSAGE_TYPE: Record<string, MessageType> = {
	ERROR: { label: 'error', severity: 0 },
	WARNING: { label: 'warning', severity: 1 },
	SUGGEST: { label: 'suggest', severity: 2 },
	INFO: { label: 'info', severity: 3 },
}

export function create_token(
	token: string,
	type: TokenType,
	{
		message = null,
		tag = {},
		specified_sense = '',
		lookup_term = '',
		lookup_results = [],
		sub_tokens = [],
		pairing = null,
		pairing_type = 'none',
		pronoun = null,
		rule_info = null,
	}: {
		message?: Message | null
		tag?: Tag
		specified_sense?: string
		lookup_term?: string
		lookup_results?: LookupResult[]
		sub_tokens?: Token[]
		pairing?: Token | null
		pairing_type?: PairingType
		pronoun?: Token | null
		rule_info?: string | null
	} = {},
): Token {
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

export function create_added_token(token: string, message: Message, rule_id: string | null = null): Token {
	const rule_info = rule_id ? `add - ${rule_id}` : null
	return create_token(token, TOKEN_TYPE.ADDED, { message, rule_info })
}

export function create_gap_token(rule_id: string, label: string, tag: Tag = {}): Token {
	const token = `GAP_${label}`
	const gap_result = create_lookup_result({ stem: token, part_of_speech: 'Noun' })
	const rule_info = `add - ${rule_id}`
	return create_token(token, TOKEN_TYPE.GAP, { lookup_results: [gap_result], tag, rule_info })
}

export function create_clause_token(sub_tokens: Token[], tag: Tag = { clause_type: 'subordinate_clause' }): Token {
	return create_token('', TOKEN_TYPE.CLAUSE, { sub_tokens, tag })
}

export function get_message_type(label: MessageLabel): MessageType {
	return Object.values(MESSAGE_TYPE).find(message_type => message_type.label === label)!
}

/**
 * Set the message on the given token in the message info, or the trigger token by default.
 * The message will be formatted based on the given token and the token context values within the rule context.
 */
export function set_message(trigger_context: RuleTriggerContext, message_info: MessageInfo) {
	const token_to_flag = message_info.token_to_flag ?? trigger_context.trigger_token

	const message_type = Object.values(MESSAGE_TYPE).find(message_type => message_type.label in message_info)
	const message_text = message_type ? message_info[message_type.label] : undefined
	if (!message_text || !message_type) {
		return
	}

	const message: Message = {
		...message_type,
		message: message_info.plain ? message_text : format_token_message(trigger_context, message_text, token_to_flag),
		rule_id: trigger_context.rule_id,
	}
	set_message_plain(token_to_flag, message)
}

/**
 * Set the message on the given token. No formatting is performed.
 */
export function set_message_plain(token: Token, message: Message) {
	token.messages.push(message)
	token.applied_rules.push(`message:${message.label} - ${message.rule_id}`)
}

/**
 * Format the message based on the trigger token or the given token if provided.
 * The message will also be formatted based on the token context values within the rule context.
 */
export function format_token_message({ tokens, trigger_token, context_indexes }: RuleTriggerContext, message: string, token: Token = trigger_token): string {
	return context_indexes.reduce(replace_context_markers, replace_markers(message, token))

	function replace_context_markers(text: string, token_index: number, context_number: number): string {
		return replace_markers(text, tokens[token_index], `${context_number}:`)
	}

	function replace_markers(text: string, token: Token, context_prefix: string = ''): string {
		const result = token.lookup_results.at(0)
		const stem = result?.stem ?? token.token
		return text
			.replaceAll(`{${context_prefix}stem}`, stem)
			.replaceAll(`{${context_prefix}token}`, token.token)
			.replaceAll(`{${context_prefix}category}`, result?.part_of_speech ?? 'word')
			.replaceAll(`{${context_prefix}sense}`, result ? stem_with_sense(result) : stem)
	}
}

export function token_has_error(token: TokenBase): boolean {
	return token_has_message(token, 'error')
}

export function token_has_message(token: TokenBase, type_to_check: MessageLabel | null = null): boolean {
	return type_to_check
		? token.messages.some(({ label }) => label === type_to_check)
		: token.messages.length > 0
}

export function is_one_part_of_speech(token: Token): boolean {
	const part_of_speech_0 = token.lookup_results.at(0)?.part_of_speech ?? ''
	return token.lookup_results.every(LOOKUP_FILTERS.IS_PART_OF_SPEECH(part_of_speech_0))
}

export function split_stem_and_sense(term: string): { stem: string, sense: string } {
	const match = term.match(REGEXES.EXTRACT_STEM_AND_SENSE)!
	return { stem: match[1], sense: match[2] ?? '' }
}

export function add_tag_to_token(token: Token, tag: Tag, rule_id: string = 'Unknown') {
	token.tag = { ...token.tag, ...tag }
	token.applied_rules.push(`tag:${Object.keys(tag).join('|')} - ${rule_id}`)
}

/**
 * This checks if there is any value for a specific key, or if any of the given values
 * are present for the specified keys.
 */
export function token_has_tag(token: Token, tag_to_check: Tag | string | (Tag | string)[]): boolean {
	if (Array.isArray(tag_to_check)) {
		return tag_to_check.some(tag => token_has_tag(token, tag))
	}
	if (typeof tag_to_check === 'string') {
		const filter_keys = tag_to_check.split('|')
		return filter_keys.some(key => (token.tag[key]?.length ?? 0) > 0)
	}
	return Object.entries(tag_to_check).every(([key, value]) => {
		const tag_values = token.tag[key]?.split('|') ?? []
		if (value.includes('|')) {
			const filter_values = value.split('|')
			return filter_values.some(tag => tag_values.includes(tag))
		} else if (value.includes('&')) {
			const filter_values = value.split('&')
			return filter_values.every(tag => tag_values.includes(tag))
		} else {
			return tag_values.includes(value)
		}
	})
}

export function flatten_token(token: Token): Token[] {
	if (token.type === TOKEN_TYPE.CLAUSE) {
		return token.sub_tokens.flatMap(flatten_token)
	}
	return [token]
}

export function flatten_sentence(sentence: Sentence): Token[] {
	return flatten_token(sentence.clause)
}

export function stem_with_sense(result: { stem: string, sense: string }): string {
	return result.sense.length ? `${result.stem}-${result.sense}` : result.stem
}

export function create_lookup_result(
	{ stem, part_of_speech }: { stem: string, part_of_speech: string },
	{
		form = 'stem',
		sense = '',
		level = -1,
		gloss = '',
		categorization = '',
		how_to = [],
		case_frame = null,
		ontology_status = 'unknown',
	}: {
		form?: string
		sense?: string
		level?: number
		gloss?: string
		categorization?: string
		how_to?: HowToEntry[]
		case_frame?: CaseFrameResult | null
		ontology_status?: OntologyStatus
	} = {},
): LookupResult {
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

export function create_case_frame(
	{
		status = 'unchecked',
		valid_arguments = [],
		extra_arguments = [],
		missing_arguments = [],
	}: {
		status?: CaseFrameStatus
		valid_arguments?: RoleMatchResult[]
		extra_arguments?: RoleMatchResult[]
		missing_arguments?: RoleTag[]
	} = {},
): CaseFrameResult {
	return {
		status,
		valid_arguments,
		extra_arguments,
		missing_arguments,
	}
}
