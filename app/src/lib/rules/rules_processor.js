import {create_clause_token} from '$lib/parser/token'

/**
 * 
 * @param {TokenRule[]} rules 
 * @returns {(sentences: Sentence[]) => Sentence[]}
 */
export function rules_applier(rules) {
	return sentences => apply_rules(sentences, rules)
}

/**
 * 
 * @param {Sentence[]} sentences 
 * @param {TokenRule[]} rules 
 * @returns {Sentence[]}
 */
export function apply_rules(sentences, rules) {
	return sentences.map(sentence => create_sentence(apply_rules_to_tokens(sentence.clause.sub_tokens, rules)))
	
	/**
	 * 
	 * @param {Token[]} tokens 
	 * @param {TokenRule[]} rules 
	 * @returns {Token[]}
	 */
	function apply_rules_to_tokens(tokens, rules) {
		/** @type {Token[]} */
		tokens = tokens.slice()

		for (let rule of rules) {
			tokens = apply_rule_to_tokens(tokens, rule)
		}

		return tokens
	}

	/**
	 * 
	 * @param {Token[]} tokens
	 * @param {TokenRule} rule
	 * @returns {Token[]}
	 */
	function apply_rule_to_tokens(tokens, rule) {
		if (tokens.length === 0) {
			return tokens
		}

		for (let i = 0; i < tokens.length;) {
			tokens[i].sub_tokens = apply_rule_to_tokens(tokens[i].sub_tokens, rule)

			if (!rule.trigger(tokens[i])) {
				i++
				continue
			}
			const context_result = rule.context(tokens, i)
			if (!context_result.success) {
				i++
				continue
			}
			i = rule.action(tokens, i, context_result.indexes)
		}

		return tokens
	}
}

/**
 * 
 * @param {Token[]} sub_tokens 
 * @returns {Sentence}
 */
function create_sentence(sub_tokens) {
	return { clause: create_clause_token(sub_tokens) }
}