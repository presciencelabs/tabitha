import { TOKEN_TYPE } from '../parser/token'
import { tokenize_input } from '../parser/tokenize'
import { clausify } from '../parser/clausify'
import { apply_rules } from './rules_processor'
import { describe, expect, test } from 'vitest'
import { TRANSFORM_RULES } from './transform_rules'

/**
 * 
 * @param {string} stem
 * @param {Object} [data={}] 
 * @param {string} [data.sense='A'] 
 * @param {string} [data.part_of_speech='Noun'] 
 * @param {number} [data.level=1] 
 * @returns {LookupResult}
 */
function create_lookup_result(stem, { sense='A', part_of_speech='Noun', level=1 }={}) {
	const concept = {
		id: '0',
		stem,
		sense,
		part_of_speech,
		level,
		gloss: '',
		categorization: '',
	}
	return {
		stem,
		part_of_speech,
		form: 'stem',
		concept,
		how_to: [],
	}
}

describe('builtin tag setting', () => {
	const TRANSFORM_RULES_BUILTIN = TRANSFORM_RULES.slice(0, 2)

	test('relative clause tag', () => {
		const test_tokens = clausify(tokenize_input('People [who] say [who] person ["who].'))
		test_tokens[0].clause.sub_tokens[0].lookup_results.push(create_lookup_result('person', { part_of_speech: 'Noun' }))
		test_tokens[0].clause.sub_tokens[2].lookup_results.push(create_lookup_result('say', { part_of_speech: 'Verb' }))
		test_tokens[0].clause.sub_tokens[4].lookup_results.push(create_lookup_result('person', { part_of_speech: 'Noun' }))

		const checked_tokens = apply_rules(test_tokens, TRANSFORM_RULES_BUILTIN)
		const clause_tokens = checked_tokens[0].clause.sub_tokens
		
		expect(clause_tokens[1].type).toBe(TOKEN_TYPE.CLAUSE)
		expect(clause_tokens[1].tag).toBe('relative_clause')
		expect(clause_tokens[3].type).toBe(TOKEN_TYPE.CLAUSE)
		expect(clause_tokens[3].tag).not.toBe('relative_clause')
		expect(clause_tokens[5].type).toBe(TOKEN_TYPE.CLAUSE)
		expect(clause_tokens[5].tag).not.toBe('relative_clause')
	})
	test('"that" clause tag', () => {
		const test_tokens = clausify(tokenize_input('That person [that]. John saw [that].'))
		test_tokens[0].clause.sub_tokens[1].lookup_results.push(create_lookup_result('person', { part_of_speech: 'Noun' }))
		test_tokens[1].clause.sub_tokens[1].lookup_results.push(create_lookup_result('see', { part_of_speech: 'Verb' }))

		const checked_tokens = apply_rules(test_tokens, TRANSFORM_RULES_BUILTIN)
		
		expect(checked_tokens[0].clause.sub_tokens[2].tag).toBe('relative_clause')
		expect(checked_tokens[0].clause.sub_tokens[2].sub_tokens[1].tag).toBe('relativizer')
		
		expect(checked_tokens[1].clause.sub_tokens[2].tag).toBe('subordinate_clause')
		expect(checked_tokens[1].clause.sub_tokens[2].sub_tokens[1].tag).toBe('remote_demonstrative')
	})
})