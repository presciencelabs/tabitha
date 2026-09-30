import { describe, expect, it } from 'vitest'
import { parse_complex_terms } from './index'

const HEADERS = 'Use simple terms in Phase 1\nComplex term\tPart of speech\tStructure\tPairings\tExplication\tStatus\tLevel\tNotes\n\n'

const parse_rows = (...rows: string[]) => parse_complex_terms(`${HEADERS}${rows.join('\r\n')}`)

describe('parse_complex_terms', () => {
	it('skips the header rows and blank lines', () => {
		expect(parse_complex_terms(`${HEADERS}\r\n\r\n`)).toEqual([])
	})

	it('splits a "stem-Sense" term into stem and sense, and title-cases the part of speech', () => {
		const [term] = parse_rows('love-A\tnoun\tstructure\tpairing\texplication\tsuggested\tlevel 2\tsome notes')

		expect(term.stem).toBe('love')
		expect(term.sense).toBe('A')
		expect(term.part_of_speech).toBe('Noun')
		expect(term.level).toBe(2)
	})

	it('falls back to the raw term with an empty sense when there is no "-Sense" suffix', () => {
		const [term] = parse_rows('fellowship\tnoun\t\t\t\tsuggested\tlevel 1\t')

		expect(term.stem).toBe('fellowship')
		expect(term.sense).toBe('')
	})

	it('parses a "level N" string into its integer, defaulting to -1 when unparseable', () => {
		const [with_level, without_level] = parse_rows(
			'love-A\tnoun\t\t\t\tsuggested\tlevel 3\t',
			'love-B\tnoun\t\t\t\tsuggested\tunknown\t',
		)

		expect(with_level.level).toBe(3)
		expect(without_level.level).toBe(-1)
	})

	it('trims and title-cases the part of speech regardless of input casing', () => {
		const [term] = parse_rows('run-A\t  VERB  \t\t\t\tsuggested\tlevel 1\t')

		expect(term.part_of_speech).toBe('Verb')
	})

	it('passes through structure, pairing, explication, ontology_status, and notes unchanged', () => {
		const [term] = parse_rows('walk-A\tverb\tVerb + Adverb\trun quickly\tto move fast\tapproved\tlevel 1\treview later')

		expect(term.structure).toBe('Verb + Adverb')
		expect(term.pairing).toBe('run quickly')
		expect(term.explication).toBe('to move fast')
		expect(term.ontology_status).toBe('approved')
		expect(term.notes).toBe('review later')
	})

	it('fills columns missing from a short row with empty strings, never undefined', () => {
		const [term] = parse_rows(':\tPunctuation\t\t.\t\tnot used\tn/a')

		expect(term).toMatchObject({ stem: ':', sense: '', level: -1, notes: '' })
	})
})
