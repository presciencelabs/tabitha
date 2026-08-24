import { describe, expect, it } from 'bun:test'
import { create_multiline_literal_tracker } from './types'

function scan(lines: string[]): boolean[] {
	const line_is_inside_multiline_literal = create_multiline_literal_tracker()
	return lines.map(line_is_inside_multiline_literal)
}

describe('create_multiline_literal_tracker', () => {
	it('reports every line as outside when there is no template literal or HTML comment', () => {
		expect(scan([
			'const x = 1',
			'function foo() {',
			'	return x',
			'}',
		])).toEqual([false, false, false, false])
	})

	it('reports lines fully inside a multi-line template literal as inside, but not the opening or trailing lines', () => {
		const results = scan([
			'const prompt = `',
			'this is prose, not code: any theological claim',
			'more prose here',
			'`',
			'const y = 2',
		])
		expect(results).toEqual([false, true, true, true, false])
	})

	it('does not treat a single-line template literal as opening multi-line state', () => {
		const results = scan([
			'const x = `hello`',
			'const y: any = 1',
		])
		expect(results).toEqual([false, false])
	})

	it('does not desync on a stray backtick inside a plain single- or double-quoted string', () => {
		const results = scan([
			"const s = 'it`s here'",
			'const t = "another ` backtick"',
			'const after: any = 1',
		])
		expect(results).toEqual([false, false, false])
	})

	it('ignores template-literal-opening characters after a line comment', () => {
		const results = scan([
			'// a comment mentioning a ` backtick',
			'const after: any = 1',
		])
		expect(results).toEqual([false, false])
	})

	it('reports lines inside an HTML comment as inside', () => {
		const results = scan([
			'<!-- prose describing something: any old text',
			'still inside the comment',
			'-->',
			'<div>after</div>',
		])
		expect(results).toEqual([false, true, true, false])
	})

	it('tracks state across a full lifecycle: code, then a literal, then more code', () => {
		const results = scan([
			'function get_prompt(): string {',
			'	return `',
			'	Explain: any claim not in the source.',
			'	`',
			'}',
			'const leaked: any = get_prompt()',
		])
		expect(results).toEqual([false, false, true, true, false, false])
	})
})
