import {TOKEN_TYPE, check_token_lookup, convert_to_error_token, create_added_token, set_token_concept} from '$lib/parser/token'

/**
 *
 * @param {any} rule_json
 * @returns {TokenRule}
 */
export function parse_lookup_rule(rule_json) {
	const trigger = create_token_filter(rule_json['trigger'])
	const context = create_context_filter(rule_json['context'])

	const lookup_term = rule_json['lookup']
	const combine = rule_json['combine'] ?? 0

	// TODO support multiple transforms if context requires multiple tokens
	const context_transforms = [create_token_transform(rule_json['context_transform'])]

	return {
		trigger,
		context,
		action: lookup_rule_action,
	}

	/**
	 * 
	 * @param {Token[]} tokens 
	 * @param {number} trigger_index 
	 * @param {number[]} context_indexes 
	 * @returns {number}
	 */
	function lookup_rule_action(tokens, trigger_index, context_indexes) {
		tokens[trigger_index] = {...tokens[trigger_index], lookup_term}

		if (context_indexes.length === 0) {
			return trigger_index + 1
		}

		// apply possible context transforms
		apply_token_transforms(tokens, context_indexes, context_transforms)

		if (combine === 0 || context_indexes[combine-1] !== trigger_index + combine) {
			return trigger_index + 1
		}
		
		// combine context tokens into one
		const tokens_to_combine = tokens.splice(trigger_index, combine + 1)
		const new_token_value = tokens_to_combine.map(token => token.token).join(' ')
		tokens.splice(trigger_index, 0, {...tokens_to_combine[0], token: new_token_value})
		return trigger_index + combine + 1
	}
}

/**
 *
 * @param {any} rule_json
 * @returns {TokenRule}
 */
export function parse_part_of_speech_rule(rule_json) {
	const trigger = trigger_filter(rule_json['category'])
	const context = create_context_filter(rule_json['context'])
	const action = create_remove_action(rule_json['remove'])

	return {
		trigger,
		context,
		action,
	}

	/**
	 * 
	 * @param {string} categories_json 
	 * @returns {TokenFilter}
	 */
	function trigger_filter(categories_json) {
		// the token must have at least one result from each given category
		const categories = categories_json.split('|')
		return token => categories.every(category => token.lookup_results.some(result => result.part_of_speech === category))
	}

	/**
	 * 
	 * @param {string} remove_json
	 * @returns {RuleAction}
	 */
	function create_remove_action(remove_json) {
		return create_token_map_action(token => {
			const form_results = token.form_results.filter(result => result.part_of_speech !== remove_json)
			const lookup_results = token.lookup_results.filter(result => result.part_of_speech !== remove_json)
			return {...token, form_results, lookup_results}
		})
	}
}

/**
 *
 * @param {any} rule_json
 * @returns {TokenRule}
 */
export function parse_transform_rule(rule_json) {
	const trigger = create_token_filter(rule_json['trigger'])
	const context = create_context_filter(rule_json['context'])
	const transform = create_token_transform(rule_json['transform'])

	// TODO support multiple transforms if context requires multiple tokens
	const context_transforms = [create_token_transform(rule_json['context_transform'])]

	return {
		trigger,
		context,
		action: transform_rule_action,
	}

	/**
	 * 
	 * @param {Token[]} tokens 
	 * @param {number} trigger_index 
	 * @param {number[]} context_indexes 
	 * @returns {number}
	 */
	function transform_rule_action(tokens, trigger_index, context_indexes) {
		tokens[trigger_index] = transform(tokens[trigger_index])
		apply_token_transforms(tokens, context_indexes, context_transforms)
		
		return trigger_index + 1
	}
}

/**
 *
 * @param {any} rule_json
 * @returns {TokenRule}
 */
export function parse_checker_rule(rule_json) {
	const trigger = create_token_filter(rule_json['trigger'])
	const context = create_context_filter(rule_json['context'])

	// one of these has to be present, but not both
	const require_json = rule_json['require']
	const suggest_json = rule_json['suggest']
	const action = require_json ? checker_require_action(require_json) : checker_suggest_action(suggest_json)

	return {
		trigger,
		context,
		action,
	}

	/**
	 * 
	 * @param {CheckerAction} require
	 * @returns {RuleAction}
	 */
	function checker_require_action(require) {
		return (tokens, trigger_index) => {
			// The action will have a precededby, followedby, or neither. Never both.
			if (require.precededby) {
				tokens.splice(trigger_index, 0, create_added_token(require.precededby, {error: require.message}))
				return trigger_index + 2
			}
			if (require.followedby) {
				tokens.splice(trigger_index + 1, 0, create_added_token(require.followedby, {error: require.message}))
				return trigger_index + 2
			}

			tokens[trigger_index] = convert_to_error_token(tokens[trigger_index], require.message)
			return trigger_index + 1
		}
	}

	/**
	 * suggest only applies on the trigger token (for now)
	 * @param {CheckerAction} suggest
	 * @returns {RuleAction}
	 */
	function checker_suggest_action(suggest) {
		return create_token_map_action(token => ({...token, suggest_message: suggest.message}))
	}
}

/**
 * 
 * @param {Token[]} tokens 
 * @param {number[]} token_indexes 
 * @param {TokenTransform[]} transforms 
 */
function apply_token_transforms(tokens, token_indexes, transforms) {
	for (let i = 0; i < token_indexes.length && i < transforms.length; i++) {
		tokens[token_indexes[i]] = transforms[i](tokens[token_indexes[i]])
	}
}

/**
 *
 * @param {any} filter_json
 * @returns {TokenFilter}
 */
export function create_token_filter(filter_json) {
	if (filter_json === undefined || filter_json === 'all') {
		return () => true
	}

	/** @type {TokenFilter[]} */
	const filters = []

	add_value_filter('token', token => token.token)
	add_value_filter('type', token => token.type)

	// a token tag can have | separated values
	const tag_json = filter_json['tag']
	if (tag_json !== undefined) {
		const value_checker = get_value_checker(tag_json)
		filters.push(token => {
			const token_tags = token.tag.split('|')
			return token_tags.some(tag => value_checker(tag))
		})
	}

	// a token form can have | separated values
	const form_json = filter_json['form']
	if (form_json !== undefined) {
		filters.push(token => {
			return token.form_results.length
				? token.form_results.every(form => get_value_checker(form.form)(form_json))
				: false
		})
	}

	add_lookup_filter('stem', lookup => lookup.stem, form => form.stem, token => token.token)
	add_lookup_filter('category', lookup => lookup.part_of_speech, form => form.part_of_speech)
	add_lookup_filter('level', concept => `${concept.level}`)

	if (filters.length === 0) {
		return () => false
	}
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
	 * @param {(concept: OntologyResult) => string} lookup_value_getter
	 * @param {((form: FormResult) => string)?} form_value_getter
	 * @param {((token: Token) => string)?} default_getter
	 */
	function add_lookup_filter(property_name, lookup_value_getter, form_value_getter=null, default_getter=null) {
		const property_json = filter_json[property_name]
		if (property_json !== undefined) {
			const value_checker = get_value_checker(property_json)
			filters.push(token => {
				if (token.type !== TOKEN_TYPE.LOOKUP_WORD) {
					return false
					
				} else if (token.lookup_results.length) {
					return token.lookup_results.every(lookup => value_checker(lookup_value_getter(lookup)))
	
				} else if (form_value_getter && token.form_results.length) {
					return token.form_results.every(form => value_checker(form_value_getter(form)))
	
				} else if (default_getter) {
					return value_checker(default_getter(token))
				}
				return false
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
				return context_result(true, ...results.flatMap(result => result.indexes))
			} else {
				return context_result(false)
			}
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
				const {success, indexes} = filter(tokens, start_index)
				if (!success) {
					return context_result(false)
				}
				start_index = indexes[0]
				all_indexes.push(start_index)
			}

			if (reverse) {
				all_indexes.reverse()
			}

			return context_result(true, ...all_indexes)
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
					return context_result(true, i)
				}
				if (!skip_filter(tokens[i]) && tokens[i].type !== TOKEN_TYPE.NOTE) {
					return context_result(false)
				}
			}
			return context_result(false)
		}
	}

	/**
	 * Skip can have one token filter or an array of filters which act as OR conditions
	 * @param {any} skip_json 
	 * @returns {TokenFilter}
	 */
	function create_skip_filter(skip_json) {
		if (Array.isArray(skip_json)) {
			const filters = skip_json.map(create_token_filter)
			return token => filters.some(filter => filter(token))
		}
		return create_token_filter(skip_json)
	}
}

/**
 * 
 * @param {boolean} success 
 * @param {number[]} indexes 
 */
function context_result(success, ...indexes) {
	return { success, indexes }
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
		transforms.push(token => ({...token, type}))
	}

	const tag = transform_json['tag']
	if (tag !== undefined) {
		transforms.push(token => ({...token, tag}))
	}

	const function_tag = transform_json['function']
	if (function_tag !== undefined) {
		transforms.push(token => ({...token, type: TOKEN_TYPE.FUNCTION_WORD, tag: function_tag, lookup_results: []}))
	}

	const concept = transform_json['concept']
	if (concept !== undefined) {
		transforms.push(token => set_token_concept(token, concept))
	}

	if (transforms.length === 0) {
		return token => token
	} else if (transforms.length === 1) {
		return transforms[0]
	} else {
		return token => transforms.reduce((new_token, transform) => transform(new_token), token)
	}
}

/**
 * 
 * @param {(token: Token) => Token} mapper 
 * @returns {RuleAction}
 */
export function create_token_map_action(mapper) {
	return (tokens, trigger_index) => {
		tokens[trigger_index] = mapper(tokens[trigger_index])
		return trigger_index + 1
	}
}

/**
 * 
 * @param {(token: Token) => void} action 
 * @returns {RuleAction}
 */
export function create_token_modify_action(action) {
	return (tokens, trigger_index) => {
		action(tokens[trigger_index])
		return trigger_index + 1
	}
}