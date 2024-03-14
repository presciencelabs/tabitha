import { TOKEN_TYPE, set_token_concept } from '$lib/parser/token'

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

	add_lookup_filter('stem', filter_value => {
		const value_checker = get_value_checker(filter_value)
		return lookup => value_checker(lookup.stem)
	})
	add_lookup_filter('category', filter_value => {
		const value_checker = get_value_checker(filter_value)
		return lookup => value_checker(lookup.part_of_speech)
	})
	add_lookup_filter('level', filter_value => {
		const value_checker = get_value_checker(filter_value)
		return lookup => value_checker(`${lookup.concept?.level}`)
	})

	// only support single character usages right now
	add_lookup_filter('usage', filter_value => has_usage(filter_value))

	add_lookup_filter('form', filter_value => lookup => get_value_checker(lookup.form)(filter_value))

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
				const { success, indexes } = filter(tokens, start_index)
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
		transforms.push(token => ({ ...token, type }))
	}

	const tag = transform_json['tag']
	if (tag !== undefined) {
		transforms.push(token => ({ ...token, tag }))
	}

	const function_tag = transform_json['function']
	if (function_tag !== undefined) {
		// TODO keep form name value from lookup somehow
		transforms.push(token => ({ ...token, type: TOKEN_TYPE.FUNCTION_WORD, tag: function_tag, lookup_results: [] }))
	}

	const concept = transform_json['concept']
	if (concept !== undefined) {
		transforms.push(token => set_token_concept(token, concept))
	}

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
}

/**
 *
 * @param {string} char
 * @returns {LookupFilter}
 */
function has_usage(char) {
	return ({ concept }) => concept !== null && concept.categorization.includes(char)
}

/**
 *
 * @param {string} char
 * @returns {LookupFilter}
 */
function may_have_usage(char) {
	return ({ concept }) => concept !== null && (concept.categorization.length === 0 || concept.categorization.includes(char))
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