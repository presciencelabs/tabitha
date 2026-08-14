import { describe, expect, it } from 'vitest'
import {
	bible_books,
	default_categories,
	levels,
	parts_of_speech,
	semantic_category,
	sources,
	theta_grid,
	theta_grid_arguments,
	usage_info,
} from './lookups'

describe('lookups', () => {
	it('defines theta grid required and optional arguments', () => {
		expect(theta_grid.A).toBe('Agent-like')
		expect(theta_grid.a).toBe('(Agent-like)')
		expect(theta_grid._).toBe('')
		expect(theta_grid_arguments).toContain('Agent-like')
		expect(theta_grid_arguments).toContain('Patient-like')
		expect(theta_grid_arguments).toHaveLength(9)
	})

	it('defines semantic categories for Adjective and Noun', () => {
		expect(semantic_category.Adjective?.G).toBe('Generic')
		expect(semantic_category.Adjective?.L).toBe('Color')
		expect(semantic_category.Noun?.A).toBe('Abstracts')
		expect(semantic_category.Noun?.o).toBe('All other objects')
	})

	it('defines usage info lists for particle types and adjective', () => {
		expect(usage_info.Adjective).toHaveLength(6)
		expect(usage_info.Adposition).toHaveLength(3)
		expect(usage_info.Adverb).toHaveLength(3)
		expect(usage_info.Conjunction).toHaveLength(4)
	})

	it('initializes default categories for major parts of speech', () => {
		expect(default_categories.Noun).toEqual(['All other objects'])
		expect(default_categories.Verb?.[0]).toBe('Agent-like')
		expect(default_categories.Adjective?.[0]).toBe('Generic')
	})

	it('maps Bible books with 66 canonical books plus TBTA edge cases', () => {
		expect(bible_books[1]).toBe('Genesis')
		expect(bible_books[40]).toBe('Matthew')
		expect(bible_books[66]).toBe('Revelation')
		expect(bible_books[67]).toBe('Revelations')
	})

	it('defines sources and level mappings', () => {
		expect(sources.has('Bible')).toBe(true)
		expect(sources.has('Grammar Introduction')).toBe(true)
		expect(levels.get('0')).toBe('Semantic Primitive')
		expect(levels.get('1')).toBe('Semantic Molecule')
		expect(parts_of_speech).toContain('Noun')
		expect(parts_of_speech).toContain('Verb')
	})
})
