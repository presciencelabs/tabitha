import { TOKEN_TYPE, set_message, set_token_concept, token_has_tag } from '$lib/parser/token'

/**
 *
 * @param {any} filter_json
 * @returns {TokenFilter}
 */
export function create_token_filter(filter_json) {
	if (filter_json === undefined || filter_json === 'none') {
		return () => false
	}
	if (filter_json === 'all') {
		return () => true
	}

	/** @type {TokenFilter[]} */
	const filters = []

	add_value_filter('token', token => token.token)
	add_value_filter('type', token => token.type)

	// a token tag can have | separated values
	const tag_json = filter_json['tag']
	if (tag_json !== undefined) {
		filters.push(token => token_has_tag(token, tag_json))
	}

	add_lookup_filter('stem', filter_value => {
		const value_checker = get_value_checker(filter_value)
		return lookup => value_checker(lookup.stem)
	})
	add_lookup_filter('category', filter_value => {
		const value_checker = get_value_checker(filter_value.toLowerCase())
		return lookup => value_checker(lookup.part_of_speech.toLowerCase())
	})
	add_lookup_filter('level', filter_value => {
		const value_checker = get_value_checker(filter_value)
		return lookup => value_checker(`${lookup.concept?.level}`)
	})

	// only support single character usages right now
	// TODO remove this and use the case frame/sense selection rules instead
	add_lookup_filter('usage', filter_value => has_usage(filter_value))

	add_lookup_filter('form', filter_value => {
		const filter_forms = filter_value.split('|')
		return lookup => {
			const lookup_forms = lookup.form.split('|')
			return lookup_forms.some(form => filter_forms.includes(form))
		}
	})

	return token => filters.every(filter => filter(token))

	/**
	 *
	 * @param {string} property_name
	 * @param {(token: Token) => string?} value_getter
	 */
	function add_value_filter(property_name, value_getter) {
		const property_json = filter_json[property_name]
		if (property_json !== undefined) {
			const value_checker = get_value_checker(property_json)
			filters.push(token => value_checker(value_getter(token)))
		}
	}

	/**
	 *
	 * @param {string} property_name
	 * @param {(json: string) => LookupFilter} lookup_filter_getter
	 */
	function add_lookup_filter(property_name, lookup_filter_getter) {
		const property_json = filter_json[property_name]
		if (property_json !== undefined) {
			const lookup_filter = lookup_filter_getter(property_json)
			filters.push(token => {
				if (token.lookup_results.length === 0) {
					return false
				}
				return token.lookup_results.every(lookup_filter)
			})
		}
	}

	/**
	 *
	 * @param {string} filter_value
	 * @returns {(value: string?) => boolean}
	 */
	function get_value_checker(filter_value) {
		const filter_values = filter_value.split('|')
		if (filter_values.length > 1) {
			return value => value !== null && filter_values.includes(value)
		}
		return value => value === filter_value
	}
}

/**
 *
 * @param {any} context_json
 * @returns {TokenContextFilter}
 */
export function create_context_filter(context_json) {
	if (context_json === undefined) {
		return () => context_result(true)
	}

	/** @type {TokenContextFilter[]} */
	const filters = []

	const preceded_by = context_json['precededby']
	if (preceded_by !== undefined) {
		filters.push(create_directional_context_filter(preceded_by, -1))
	}

	const not_preceded_by = context_json['notprecededby']
	if (not_preceded_by !== undefined) {
		filters.push(negate(create_directional_context_filter(not_preceded_by, -1)))
	}

	const followed_by = context_json['followedby']
	if (followed_by !== undefined) {
		filters.push(create_directional_context_filter(followed_by, +1))
	}

	const not_followed_by = context_json['notfollowedby']
	if (not_followed_by !== undefined) {
		filters.push(negate(create_directional_context_filter(not_followed_by, +1)))
	}

	const subtokens = context_json['subtokens']
	if (subtokens !== undefined) {
		filters.push(create_subtokens_filter(subtokens))
	}

	if (filters.length === 0) {
		return () => context_result(true)
	} else if (filters.length === 1) {
		return (tokens, start_index) => filters[0](tokens, start_index)
	} else {
		return combine(filters)
	}

	/**
	 *
	 * @param {TokenContextFilter} filter
	 * @returns {TokenContextFilter}
	 */
	function negate(filter) {
		return (tokens, start_index) => filter(tokens, start_index).success ? context_result(false) : context_result(true)
	}

	/**
	 *
	 * @param {TokenContextFilter[]} filters
	 * @returns {TokenContextFilter}
	 */
	function combine(filters) {
		return (tokens, start_index) => {
			const results = filters.map(filter => filter(tokens, start_index))
			if (results.every(result => result.success)) {
				return context_result(true, {
					context_indexes: results.flatMap(result => result.context_indexes),
					subtoken_indexes: results.flatMap(result => result.subtoken_indexes),
				})
			} else {
				return context_result(false)
			}
		}
	}

	/**
	 *
	 * @param {any} subtoken_json
	 * @returns {TokenContextFilter}
	 */
	function create_subtokens_filter(subtoken_json) {
		const subtoken_filter = create_directional_context_filter(subtoken_json, +1)

		return (tokens, start_index) => {
			if (tokens[start_index].sub_tokens.length === 0) {
				return context_result(false)
			}

			const clause = tokens[start_index]
			const result = subtoken_filter(clause.sub_tokens, -1)	// use -1 so that the checks start at 0
			return result.success ? context_result(true, { subtoken_indexes: result.context_indexes }) : result
		}
	}
}

/**
 *
 * @param {any} context_json
 * @param {number} offset
 * @returns {TokenContextFilter}
 */
function create_directional_context_filter(context_json, offset) {
	if (Array.isArray(context_json)) {
		const filters = context_json.map(filter_json => create_single_context_filter(filter_json, offset))
		return create_multi_context_filter(filters, offset < 0)
	} else {
		return create_single_context_filter(context_json, offset)
	}

	/**
	 *
	 * @param {TokenContextFilter[]} filters
	 * @param {boolean} reverse
	 * @returns {TokenContextFilter}
	 */
	function create_multi_context_filter(filters, reverse) {
		// precededby filters have the first element be the furthest from the trigger,
		// and the last element is closest to the trigger.
		if (reverse) {
			filters.reverse()
		}

		return (tokens, start_index) => {
			const all_indexes = []
			for (let filter of filters) {
				const { success, context_indexes: indexes } = filter(tokens, start_index)
				if (!success) {
					return context_result(false)
				}
				start_index = indexes[0]
				all_indexes.push(start_index)
			}

			if (reverse) {
				all_indexes.reverse()
			}

			return context_result(true, { context_indexes: all_indexes })
		}
	}

	/**
	 *
	 * @param {any} context_json
	 * @param {number} offset
	 * @returns {TokenContextFilter}
	 */
	function create_single_context_filter(context_json, offset) {
		const filter = create_token_filter(context_json)

		/** @type {TokenFilter} */
		const skip_filter = context_json['skip'] !== undefined
			? create_skip_filter(context_json['skip'])
			: () => false

		/** @type {(tokens: Token[], i: number) => boolean} */
		const end_check = offset < 0 ? (_, i) => i >= 0 : (tokens, i) => i < tokens.length

		return check_context_with_skip

		/**
		 * @param {Token[]} tokens
		 * @param {number} start_index
		 * @returns {ContextFilterResult}
		 */
		function check_context_with_skip(tokens, start_index) {
			for (let i = start_index + offset; end_check(tokens, i); i += offset) {
				if (filter(tokens[i])) {
					return context_result(true, { context_indexes: [i] })
				}
				if (!skip_filter(tokens[i]) && tokens[i].type !== TOKEN_TYPE.NOTE) {
					return context_result(false)
				}
			}
			return context_result(false)
		}
	}
}

/**
 * Skip can have one token filter or an array of filters which act as OR conditions.
 * Skip can also use preset groups useful for skipping phrases and parts of phrases.
 * @param {any} skip_json 
 * @returns {TokenFilter}
 */
export function create_skip_filter(skip_json) {
	if (typeof skip_json === 'string' && SKIP_GROUPS.has(skip_json)) {
		skip_json = SKIP_GROUPS.get(skip_json) ?? {}
	}
	if (Array.isArray(skip_json)) {
		const filters = skip_json.map(create_skip_filter)
		return token => filters.some(filter => filter(token))
	}
	return create_token_filter(skip_json)
}

/**
 *
 * @param {boolean} success
 * @param {Object} [indexes={}]
 * @param {number[]} [indexes.context_indexes=[]]
 * @param {number[]}[indexes.subtoken_indexes=[]]
 */
function context_result(success, { context_indexes=[], subtoken_indexes=[] }={}) {
	return { success, context_indexes, subtoken_indexes }
}

/**
 *
 * @param {any} transform_json
 * @returns {TokenTransform[]}
 */
export function create_token_transforms(transform_json) {
	if (Array.isArray(transform_json)) {
		return transform_json.map(create_token_transform)
	}
	return [create_token_transform(transform_json)]
}

/**
 *
 * @param {any} transform_json
 * @returns {TokenTransform}
 */
export function create_token_transform(transform_json) {
	if (transform_json === undefined) {
		return token => token
	}

	/** @type {TokenTransform[]} */
	const transforms = []

	const type = transform_json['type']
	if (type !== undefined) {
		transforms.push(token => ({ ...token, type }))
	}

	const tag = transform_json['tag']
	if (tag !== undefined) {
		transforms.push(token => ({ ...token, tag: add_value_to_tag(token.tag, tag) }))
	}

	const remove_tag = transform_json['remove_tag']
	if (remove_tag !== undefined) {
		transforms.push(token => ({ ...token, tag: remove_tag_labels(token.tag, remove_tag) }))
	}

	const function_tag = transform_json['function']
	if (function_tag !== undefined) {
		// TODO keep form name value from lookup somehow
		transforms.push(token => ({
			...token,
			type: TOKEN_TYPE.FUNCTION_WORD,
			tag: add_value_to_tag(token.tag, function_tag),
			lookup_results: [],
		}))
	}

	const concept = transform_json['concept']
	if (concept !== undefined) {
		transforms.push(token => set_token_concept(token, concept))
	}

	// TODO remove this and use the case frame/sense selection rules instead
	const usage = transform_json['usage']
	if (usage !== undefined) {
		transforms.push(token => filter_by_usage(token, usage))
	}

	if (transforms.length === 0) {
		return token => token
	} else if (transforms.length === 1) {
		return transforms[0]
	} else {
		return token => transforms.reduce((new_token, transform) => transform(new_token), token)
	}

	/**
	 *
	 * @param {Token} token
	 * @param {string} char
	 */
	function filter_by_usage(token, char) {
		if (token.lookup_results.some(has_usage(char))) {
			token.lookup_results = token.lookup_results.filter(may_have_usage(char))
		}
		return token
	}

	/**
	 * 
	 * @param {Tag} old_tag 
	 * @param {Tag} new_values 
	 * @returns {Tag}
	 */
	function add_value_to_tag(old_tag, new_values) {
		return { ...old_tag, ...new_values }
	}

	/**
	 * 
	 * @param {Tag} old_tag 
	 * @param {string|string[]} tags_to_remove 
	 * @returns {Tag}
	 */
	function remove_tag_labels(old_tag, tags_to_remove) {
		if (!Array.isArray(tags_to_remove)) {
			tags_to_remove = [tags_to_remove]
		}
		return Object.fromEntries(Object.entries(old_tag).filter(([k]) => !tags_to_remove.includes(k)))
	}
}

/**
 *
 * @param {string} char
 * @returns {LookupFilter}
 */
function has_usage(char) {
	return ({ concept }) => !!concept?.categorization.includes(char)
}

/**
 *
 * @param {string} char
 * @returns {LookupFilter}
 */
function may_have_usage(char) {
	return ({ concept }) => !!(concept?.categorization.length === 0 || concept?.categorization.includes(char))
}

/**
 *
 * @param {Token[]} tokens
 * @param {number[]} token_indexes
 * @param {TokenTransform[]} transforms
 */
export function apply_token_transforms(tokens, token_indexes, transforms) {
	for (let i = 0; i < token_indexes.length && i < transforms.length; i++) {
		tokens[token_indexes[i]] = transforms[i](tokens[token_indexes[i]])
	}
}

/**
 *
 * @param {(trigger_context: RuleTriggerContext) => void} action
 * @returns {RuleAction}
 */
export function simple_rule_action(action) {
	return trigger_context => {
		action(trigger_context)
		return trigger_context.trigger_index + 1
	}
}

/**
 * @param {(trigger_context: RuleTriggerContext) => Iterable<MessageInfo> | MessageInfo | undefined } action
 * @returns {RuleAction}
 */
export function message_set_action(action) {
	return trigger_context => {
		const result = action(trigger_context)
		if (result === undefined) {
			return trigger_context.trigger_index + 1
		}

		if (Symbol.iterator in result) {
			[...result].forEach(message => set_message(trigger_context, message))
		} else {
			set_message(trigger_context, result)
		}

		return trigger_context.trigger_index + 1
	}
}

const SKIP_GROUPS = new Map([
	['clause_start', [
		{ 'token': '[' },
		{ 'category': 'Conjunction' },
	]],
	['adjp_modifiers_predicative', [
		{
			'tag': [
				'degree',
				{ 'clause_type': 'patient_clause_same_participant|patient_clause_different_participant' }, 	// some adjectives can take a patient argument
			], 
		},
		{ 'category': 'Adverb' },
	]],
	['adjp_predicative', [
		'adjp_modifiers_predicative',
		{ 'tag': { 'syntax': 'coord_adj|comma' } },
		{ 'category': 'Adjective' },
	]],
	['adjp_modifiers_attributive', [
		{ 'tag': 'degree' },
	]],
	['adjp_attributive', [
		'adjp_modifiers_attributive',
		{ 'tag': { 'syntax': 'coord_adj|comma' } },
		{ 'category': 'Adjective' },
	]],
	['advp_modifiers', [
		{ 'tag': 'degree' },
	]],
	['advp', [
		'advp_modifiers',
		{ 'tag': { 'syntax': 'coord_adv|comma' } },
		{ 'category': 'Adverb' },
	]],
	['np_modifiers', [
		{ 'tag': ['determiner|relation', { 'clause_type': 'relative_clause' }] },
		'adjp_attributive',
	]],
	['np', [
		'np_modifiers',
		{ 'tag': { 'syntax': 'coord_noun|comma' } },
		{ 'category': 'Noun' },
	]],
	['vp_modifiers', [
		{ 'tag': ['verb_polarity|modal|auxiliary', { 'syntax': 'infinitive' }] },
		'advp',
	]],
	['vp', [
		'vp_modifiers',
		'coordination',
		{ 'category': 'Verb' },
	]],
])