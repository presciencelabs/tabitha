import {create_error_token} from '$lib/parser/token'
import {CHECKER_RULES} from './checker_rules'
import {TRANSFORM_RULES} from './transform_rules'

/**
 * @template {TokenRule} R
 * @param {R[]} rules 
 * @param {Token[]} tokens 
 * @param {number} index 
 * @returns {R[]}
 */
function get_triggered_rules(rules, tokens, index) {
	return rules.filter(rule => rule.trigger(tokens[index]) && rule.context(tokens, index))
}

/**
 * 
 * @param {Token[]} tokens 
 * @param {TransformRule[]} transforms
 * @returns {Token[]}
 */
export function apply_transform_rules(tokens, transforms=TRANSFORM_RULES) {
	const new_tokens = []

	for (let i = 0; i < tokens.length; i++) {
		const triggered_rules = get_triggered_rules(transforms, tokens, i)
		
		new_tokens.push(apply_transforms(triggered_rules, tokens[i]))
	}

	return new_tokens

	/**
	 * 
	 * @param {TransformRule[]} rules 
	 * @param {Token} token 
	 */
	function apply_transforms(rules, token) {
		if (rules.length === 0) {
			return token
		} else if (rules.length === 1) {
			return rules[0].transform(token)
		} else {
			return rules.reduce((new_token, rule) => rule.transform(new_token), token)
		}
	}
}

/**
 * 
 * @param {Token[]} tokens 
 * @param {CheckerRule[]} rules
 * @return {Token[]}
 */
export function apply_checker_rules(tokens, rules=CHECKER_RULES) {
	const new_tokens = []

	for (let i = 0; i < tokens.length; i++) {
		const triggered_rules = get_triggered_rules(rules, tokens, i)
		
		if (triggered_rules.length === 0) {
			new_tokens.push(tokens[i])
			continue
		}

		new_tokens.push(...create_context_tokens(triggered_rules, action => action.preceded_by))

		new_tokens.push(create_trigger_token(triggered_rules, tokens[i]))

		new_tokens.push(...create_context_tokens(triggered_rules, action => action.followed_by))
	}

	return new_tokens

	/**
	 * 
	 * @param {CheckerRule[]} rules 
	 * @param {(action: CheckerAction) => string?} token_getter 
	 */
	function create_context_tokens(rules, token_getter) {
		return rules
			.filter(rule => token_getter(rule.require))
			// @ts-ignore
			.map(rule => create_error_token(token_getter(rule.require), rule.require.message))
	}

	/**
	 * 
	 * @param {CheckerRule[]} rules 
	 * @param {Token} token 
	 */
	function create_trigger_token(rules, token) {
		const trigger_rules = rules.filter(rule => rule.require.preceded_by === undefined && rule.require.followed_by === undefined)
		if (trigger_rules.length > 0) {
			// only use the first message for now
			return create_error_token(token.token, trigger_rules[0].require.message)
		}
		return token
	}
}