import {TOKEN_TYPE, create_clause_token, create_error_token} from '$lib/parser/token'
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
 * @param {Token[]} sub_tokens 
 * @returns {Sentence}
 */
function create_sentence(sub_tokens) {
	return { clause: create_clause_token(sub_tokens) }
}

/**
 * 
 * @param {Sentence[]} sentences 
 * @param {TransformRule[]} transforms
 * @returns {Sentence[]}
 */
export function apply_transform_rules(sentences, transforms=TRANSFORM_RULES) {
	return sentences.map(sentence => create_sentence(apply_transforms_to_tokens(sentence.clause.sub_tokens, transforms)))
	
	/**
	 * 
	 * @param {Token[]} tokens 
	 * @param {TransformRule[]} transforms
	 * @returns {Token[]}
	 */
	function apply_transforms_to_tokens(tokens, transforms) {
		if (tokens.length === 0) {
			return tokens
		}

		const new_tokens = []

		for (let i = 0; i < tokens.length; i++) {
			const triggered_rules = get_triggered_rules(transforms, tokens, i)

			const new_token = transform_token(triggered_rules, tokens[i])
			new_token.sub_tokens = apply_transforms_to_tokens(tokens[i].sub_tokens, transforms)
			
			new_tokens.push(new_token)
		}
	
		return new_tokens
	}

	/**
	 * 
	 * @param {TransformRule[]} rules 
	 * @param {Token} token 
	 * @returns {Token}
	 */
	function transform_token(rules, token) {
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
 * @param {Sentence[]} sentences 
 * @param {CheckerRule[]} rules
 * @returns {Sentence[]}
 */
export function apply_checker_rules(sentences, rules=CHECKER_RULES) {
	return sentences.map(sentence => create_sentence(apply_rules_to_tokens(sentence.clause.sub_tokens, rules)))
}

/**
 * 
 * @param {Token[]} tokens 
 * @param {CheckerRule[]} rules
 * @return {Token[]}
 */
function apply_rules_to_tokens(tokens, rules) {
	const new_tokens = []

	for (let i = 0; i < tokens.length; i++) {
		const triggered_rules = get_triggered_rules(rules, tokens, i)
		
		if (triggered_rules.length > 0) {
			new_tokens.push(...create_context_tokens(triggered_rules, action => action.preceded_by))

			const new_token = create_trigger_token(triggered_rules, tokens[i])
			new_token.sub_tokens = apply_rules_to_tokens(tokens[i].sub_tokens, rules)
			new_tokens.push(new_token)
			
			new_tokens.push(...create_context_tokens(triggered_rules, action => action.followed_by))

		} else {
			tokens[i].sub_tokens = apply_rules_to_tokens(tokens[i].sub_tokens, rules)
			new_tokens.push(tokens[i])
		}

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
	 * @returns {Token}
	 */
	function create_trigger_token(rules, token) {
		const trigger_rules = rules.filter(rule => rule.require.preceded_by === undefined && rule.require.followed_by === undefined)
		if (trigger_rules.length > 0) {
			// only use the first message for now
			return {
				...token,
				type: TOKEN_TYPE.ERROR,
				message: trigger_rules[0].require.message,
			}
		}
		return token
	}
}