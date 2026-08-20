import { describe, expect, it } from 'vitest'
import { transform } from './complex_terms'

describe('transform', () => {
	it('splits a "stem-Sense" term into stem and sense, and title-cases the part of speech', () => {
		const [term] = transform(['love-A\tnoun\tstructure\tpairing\texplication\tsuggested\tlevel 2\tsome notes'])

		expect(term.stem).toBe('love')
		expect(term.sense).toBe('A')
		expect(term.part_of_speech).toBe('Noun')
		expect(term.level).toBe(2)
	})

	it('falls back to the raw term with an empty sense when there is no "-Sense" suffix', () => {
		const [term] = transform(['fellowship\tnoun\t\t\t\tsuggested\tlevel 1\t'])

		expect(term.stem).toBe('fellowship')
		expect(term.sense).toBe('')
	})

	it('parses a "level N" string into its integer, defaulting to -1 when unparseable', () => {
		const [with_level, without_level] = transform([
			'love-A\tnoun\t\t\t\tsuggested\tlevel 3\t',
			'love-B\tnoun\t\t\t\tsuggested\tunknown\t',
		])

		expect(with_level.level).toBe(3)
		expect(without_level.level).toBe(-1)
	})

	it('trims and title-cases the part of speech regardless of input casing', () => {
		const [term] = transform(['run-A\t  VERB  \t\t\t\tsuggested\tlevel 1\t'])

		expect(term.part_of_speech).toBe('Verb')
	})

	it('passes through structure, pairing, explication, ontology_status, and notes unchanged', () => {
		const [term] = transform(['walk-A\tverb\tVerb + Adverb\trun quickly\tto move fast\tapproved\tlevel 1\treview later'])

		expect(term.structure).toBe('Verb + Adverb')
		expect(term.pairing).toBe('run quickly')
		expect(term.explication).toBe('to move fast')
		expect(term.ontology_status).toBe('approved')
		expect(term.notes).toBe('review later')
	})
})
