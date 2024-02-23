import {check_token_lookup, set_token_concept} from '$lib/parser/token'

/**
 *
 * @param {any} rule_json
 * @returns {TransformRule}
 */
export function parse_transform_rule(rule_json) {
	const name = rule_json['name'] ?? ''
	const trigger = create_token_filter(rule_json['trigger'])
	const context = create_token_context(rule_json['context'])
	const transform = create_token_transform(rule_json['transform'])

	return {
		name,
		trigger,
		context,
		transform,
	}
}

/**
 *
 * @param {any} rule_json
 * @returns {CheckerRule}
 */
export function parse_checker_rule(rule_json) {
	const name = rule_json['name'] ?? ''
	const trigger = create_token_filter(rule_json['trigger'])
	const context = create_token_context(rule_json['context'])
	const require = create_checker_action(rule_json['require'])

	return {
		name,
		trigger,
		context,
		require,
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

	add_lookup_filter('stem', concept => concept.stem)
	add_lookup_filter('category', concept => concept.part_of_speech)

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
	 * @param {(concept: OntologyResult) => string} value_getter
	 */
	function add_lookup_filter(property_name, value_getter) {
		const property_json = filter_json[property_name]
		if (property_json !== undefined) {
			const value_checker = get_value_checker(property_json)
			filters.push(check_token_lookup(concept => value_checker(value_getter(concept))))
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
export function create_token_context(context_json) {
	/** @type {TokenContextFilter[]} */
	const filters = []

	const preceded_by = context_json['precededby']
	if (preceded_by !== undefined) {
		filters.push(create_context_filter(preceded_by, -1))
	}

	const followed_by = context_json['followedby']
	if (followed_by !== undefined) {
		filters.push(create_context_filter(followed_by, +1))
	}

	if (filters.length === 0) {
		return () => true
	} else if (filters.length === 1) {
		return (tokens, trigger_index) => filters[0](tokens, trigger_index)
	} else {
		return (tokens, trigger_index) => filters.every(filter => filter(tokens, trigger_index))
	}
}

/**
 *
 * @param {any} context_json
 * @param {number} offset
 * @returns {TokenContextFilter}
 */
function create_context_filter(context_json, offset) {
	const filter = create_token_filter(context_json)
	const skip_filter = context_json['skip'] !== undefined ? create_token_filter(context_json['skip']) : null

	/** @type {(tokens: Token[], i: number) => boolean} */
	const end_check = offset < 0 ? (_, i) => i >= 0 : (tokens, i) => i < tokens.length

	if (skip_filter) {
		return check_context_with_skip
	}

	return (tokens, trigger_index) => end_check(tokens, trigger_index + offset) && filter(tokens[trigger_index + offset])

	/**
	 * @param {Token[]} tokens 
	 * @param {number} trigger_index 
	 * @returns {boolean}
	 */
	function check_context_with_skip(tokens, trigger_index) {
		for (let i = trigger_index + offset; end_check(tokens, i); i += offset) {
			if (filter(tokens[i])) {
				return true
			}
			// @ts-ignore
			if (!skip_filter(tokens[i])) {
				return false
			}
		}
		return false
	}
}

/**
 *
 * @param {any} action_json
 * @returns {CheckerAction}
 */
export function create_checker_action(action_json) {
	return {
		preceded_by: action_json['precededby'],
		followed_by: action_json['followedby'],
		message: action_json['message'] ?? '',
	}
}

/**
 *
 * @param {any} transform_json
 * @returns {TokenTransform}
 */
export function create_token_transform(transform_json) {
	/** @type {TokenTransform[]} */
	const transforms = []

	const type = transform_json['type']
	if (type !== undefined) {
		transforms.push(token => ({...token, type}))
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