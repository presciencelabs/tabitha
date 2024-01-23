import {check_syntax} from './syntax'
import {describe, expect, test} from 'vitest'

describe('syntax: notes notation', () => {
	describe('valid', () => {
		// prettier-ignore
		test.each([
			[['_implicit']],
			[['_paragraph']],
			[['_explainName']],
		])('%s', test_tokens => {
			/** @type {CheckedToken[]} */
			const EXPECTED_OUTPUT = [
				{
					token: test_tokens[0],
					message: '',
				},
			]

			expect(check_syntax(test_tokens)).toEqual(EXPECTED_OUTPUT)
		})
	})

	describe('invalid', () => {
		// prettier-ignore
		test.each([
			[['x_implicit']],
			[['__implicit']],
		])('%s', test_tokens => {
			/** @type {CheckedToken[]} */
			const checked_tokens = check_syntax(test_tokens)

			expect(checked_tokens[0].token).toEqual(test_tokens[0])
			expect(checked_tokens[0].message).toBeTruthy()
		})
	})
})

describe('syntax: pronouns', () => {
	describe('valid', () => {
		// prettier-ignore
		test.each([
			[['I(Paul)']],
			[['You(Paul)']],
			[['you(Paul)']],
			[['we(people)']],
			[['her(Mary)']],
		])('%s', test_tokens => {
			/** @type {CheckedToken[]} */
			const EXPECTED_OUTPUT = [
				{
					token: test_tokens[0],
					message: '',
				},
			]

			expect(check_syntax(test_tokens)).toEqual(EXPECTED_OUTPUT)
		})
	})

	describe('invalid: catches first person (case-insensitive)', () => {
		// prettier-ignore
		test.each([
			[['I']],
			[['i']],
			[['(I)']],
			[['[I']],
			[['I]']],
			[['ME']],
			[['Me']],
			[['me']],
			[['(me)']],
			[['MY']],
			[['My']],
			[['my']],
			[['(my)']],
			[['MINE']],
			[['Mine']],
			[['mine']],
			[['(mine)']],
			[['MYSELF']],
			[['Myself']],
			[['myself']],
			[['(myself)']],
			[['WE']],
			[['We']],
			[['we']],
			[['(we)']],
			[['US']],
			[['Us']],
			[['us']],
			[['us.']],
			[['(us)']],
			[['OUR']],
			[['Our']],
			[['our']],
			[['(our)']],
			[['OURS']],
			[['Ours']],
			[['ours']],
			[['(ours)']],
			[['OURSELVES']],
			[['Ourselves']],
			[['ourselves']],
			[['(ourselves)']],
		])('%s', test_tokens => {
			/** @type {CheckedToken[]} */
			const checked_tokens = check_syntax(test_tokens)

			expect(checked_tokens[0].token).toEqual(test_tokens[0])
			expect(checked_tokens[0].message).toMatch(/^First person pronouns/)
		})
	})

	describe('invalid: catches second person (case-insensitive)', () => {
		// prettier-ignore
		test.each([
			[['YOU']],
			[['You']],
			[['you']],
			[['(you)']],
			[['YOUR']],
			[['Your']],
			[['your']],
			[['(your)']],
			[['YOURS']],
			[['Yours']],
			[['yours']],
			[['(yours)']],
			[['YOURSELF']],
			[['Yourself']],
			[['yourself']],
			[['(yourself)']],
		])('%s', test_tokens => {
			/** @type {CheckedToken[]} */
			const checked_tokens = check_syntax(test_tokens)

			expect(checked_tokens[0].token).toEqual(test_tokens[0])
			expect(checked_tokens[0].message).toMatch(/^Second person pronouns/)
		})
	})

	describe('invalid: catches third person (case-insensitive)', () => {
		// prettier-ignore
		test.each([
			[['HE']],
			[['He']],
			[['he']],
			[['(he)']],
			[['[he']],
			[['he]']],
			[['[he]']],
			[['HIM']],
			[['Him']],
			[['him']],
			[['(him)']],
			[['HIS']],
			[['His']],
			[['his']],
			[['(his)']],
			[['HIMSELF']],
			[['Himself']],
			[['himself']],
			[['(himself)']],
			[['SHE']],
			[['She']],
			[['she']],
			[['(she)']],
			[['HER']],
			[['Her']],
			[['her']],
			[['her.']],
			[['(her)']],
			[['HERS']],
			[['Hers']],
			[['hers']],
			[['(hers)']],
			[['HERSELF']],
			[['Herself']],
			[['herself']],
			[['herself;']],
			[['(herself)']],
			[['IT']],
			[['It']],
			[['it']],
			[['(it)']],
			[['ITS']],
			[['Its']],
			[['its']],
			[['(its)']],
			[['ITSELF']],
			[['Itself']],
			[['itself']],
			[['(itself)']],
			[['THEY']],
			[['They']],
			[['they']],
			[['(they)']],
			[['THEM']],
			[['Them']],
			[['them']],
			[['(them)']],
			[['THEIR']],
			[['Their']],
			[['their']],
			[['(their)']],
			[['THEIRS']],
			[['Theirs']],
			[['theirs']],
			[['(theirs)']],
			[['THEMSELVES']],
			[['Themselves']],
			[['themselves']],
			[['(themselves)']],
			[['[themselves].']],
		])('%s', test_tokens => {
			/** @type {CheckedToken[]} */
			const checked_tokens = check_syntax(test_tokens)

			expect(checked_tokens[0].token).toEqual(test_tokens[0])
			expect(checked_tokens[0].message).toMatch(/^Third person pronouns/)
		})
	})
})

describe('syntax: subordinate clauses', () => {
	describe('valid', () => {
		// prettier-ignore
		test.each([
			[['[']],
			[['[good']],
			[['[[good]]']],
		])('%s', test_tokens => {
			/** @type {CheckedToken[]} */
			const EXPECTED_OUTPUT = [
				{
					token: test_tokens[0],
					message: '',
				},
			]

			expect(check_syntax(test_tokens)).toEqual(EXPECTED_OUTPUT)
		})
	})

	describe('invalid', () => {
		// prettier-ignore
		test.each([
			[['bad[']],
			[['[bad[bad]]']],
		])('%s', test_tokens => {
			/** @type {CheckedToken[]} */
			const checked_tokens = check_syntax(test_tokens)

			expect(checked_tokens[0].token).toEqual(test_tokens[0])
			expect(checked_tokens[0].message).toBeTruthy()
		})
	})
})
