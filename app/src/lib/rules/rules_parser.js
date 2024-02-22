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

	const token_filter = filter_json['token']
	if (token_filter !== undefined) {
		filters.push(create_token_token_filter(token_filter))
	}

	const type_filter = filter_json['type']
	if (type_filter !== undefined) {
		filters.push(token => token.type === type_filter)
	}
	// TODO support filtering by lookup values such as category/stem/etc

	if (filters.length === 0) {
		return () => false
	}
	return token => filters.every(filter => filter(token))
}

/**
 *
 * @param {string} token_value
 * @return {TokenFilter}
 */
function create_token_token_filter(token_value) {
	const token_values = token_value.split('|')
	if (token_values.length > 1) {
		return token => token_values.includes(token.token)
	}
	return token => token.token === token_value
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
	 * TODO only go until a clause boundary?
	 *
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

	const lookup_term = transform_json['lookup']
	if (lookup_term !== undefined) {
		transforms.push(token => ({...token, lookup_term}))
	}

	if (transforms.length === 0) {
		return token => token
	} else if (transforms.length === 1) {
		return transforms[0]
	} else {
		return token => transforms.reduce((new_token, transform) => transform(new_token), token)
	}
}