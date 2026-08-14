import { describe, expect, it } from 'vitest'
import { by_book_order, context_argument_map, derive_filters } from './filters'
import type { Concept, Example } from '$lib/types'

function make_concept(overrides: Partial<Concept> = {}): Concept {
	return {
		id: 'person-A-Noun',
		stem: 'person',
		sense: 'A',
		part_of_speech: 'Noun',
		level: '0',
		categorization: '',
		examples: '',
		curated_examples: [],
		curated_examples_raw: '',
		gloss: 'human individual',
		brief_gloss: '',
		occurrences: 5,
		status: 'in ontology',
		categories: [],
		how_to_hints: [],
		pending_changes: [],
		...overrides,
	}
}

function make_example(book: string, context: Record<string, string> = {}): Example {
	return {
		reference: {
			type: 'Bible',
			id_primary: book,
			id_secondary: '1',
			id_tertiary: '1',
		},
		context,
		book_status: 'Ready to Translate',
	}
}

describe('examples/filters', () => {
	it('defines context arguments for parts of speech', () => {
		expect(context_argument_map.get('Noun')).toContain('Role')
		expect(context_argument_map.get('Verb')).toContain('Agent')
		expect(context_argument_map.get('Adjective')).toContain('Usage')
	})

	it('sorts examples in canonical Bible book order with by_book_order', () => {
		const ex_exodus = make_example('Exodus')
		const ex_genesis = make_example('Genesis')
		const ex_matthew = make_example('Matthew')
		const ex_revelation = make_example('Revelation')

		const list = [ex_revelation, ex_exodus, ex_matthew, ex_genesis]
		list.sort(by_book_order)

		expect(list.map(e => e.reference.id_primary)).toEqual([
			'Genesis',
			'Exodus',
			'Matthew',
			'Revelation',
		])
	})

	it('derives filter options including books and context presence', () => {
		const concept = make_concept({ part_of_speech: 'Noun' })
		const examples: Example[] = [
			make_example('Genesis', { Role: 'agent-A', Verb: 'tell-D' }),
			make_example('Exodus', { Role: 'patient-A' }),
		]

		const filters = derive_filters(concept, examples)

		expect(filters.has('Book')).toBe(true)
		const bookOptions = Array.from(filters.get('Book') || [])
		expect(bookOptions).toContain('Any')
		expect(bookOptions).toContain('Genesis')
		expect(bookOptions).toContain('Exodus')

		expect(filters.has('Role')).toBe(true)
		const roleOptions = Array.from(filters.get('Role') || [])
		expect(roleOptions).toContain('agent-A')
		expect(roleOptions).toContain('patient-A')

		expect(filters.has('Verb')).toBe(true)
		const verbOptions = Array.from(filters.get('Verb') || [])
		expect(verbOptions).toContain('Present')
		expect(verbOptions).toContain('Not present')
		expect(verbOptions).toContain('tell-D')
	})
})
