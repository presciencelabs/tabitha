import { describe, expect, test } from 'vitest'
import {
	BLOCK_COMMENT_REGEX,
	LINE_COMMENT_REGEX,
	TRAILING_COMMAS_REGEX,
	strip_jsonc_comments,
	ISO_DATE_REGEX,
	is_iso_date,
	CONCEPT_SENSE_REGEX,
	CONCEPT_UPDATE_KEY_REGEX,
	SQL_WILDCARD_CHAR_REGEX,
	normalize_wildcards,
	parse_concept_sense,
	USFM_VERSE_MARKER_REGEX,
	GLOSS_CLASSIFIER_REGEX,
	strip_gloss_classifiers,
	TRAILING_SLASH_REGEX,
	clean_trailing_slash,
} from './index'

describe('@tabitha/types/patterns', () => {
	describe('JSONC patterns & helpers', () => {
		test('strip_jsonc_comments handles single-line comments', () => {
			const jsonc = '{\n  // Single line comment\n  "key": "value"\n}'
			const result = JSON.parse(strip_jsonc_comments(jsonc))
			expect(result).toEqual({ key: 'value' })
		})

		test('strip_jsonc_comments handles multi-line block comments', () => {
			const jsonc = '{\n  /* Multi-line\n   * Block\n   */\n  "key": "value"\n}'
			const result = JSON.parse(strip_jsonc_comments(jsonc))
			expect(result).toEqual({ key: 'value' })
		})

		test('strip_jsonc_comments handles inline comments and trailing commas', () => {
			const jsonc = '{\n  "key": "value", // inline note\n  "numbers": [1, 2, ],\n}'
			const result = JSON.parse(strip_jsonc_comments(jsonc))
			expect(result).toEqual({ key: 'value', numbers: [1, 2] })
		})
	})

	describe('Date patterns & helpers', () => {
		test('is_iso_date validates correct YYYY-MM-DD dates', () => {
			expect(is_iso_date('2026-08-16')).toBe(true)
			expect(is_iso_date('1999-12-31')).toBe(true)
			expect(is_iso_date('2000-01-01')).toBe(true)
		})

		test('is_iso_date rejects invalid date formats', () => {
			expect(is_iso_date('2026-8-16')).toBe(false)
			expect(is_iso_date('08/16/2026')).toBe(false)
			expect(is_iso_date('2026-08-16T12:00:00Z')).toBe(false)
			expect(is_iso_date('invalid')).toBe(false)
		})
	})

	describe('Ontology patterns & helpers', () => {
		test('CONCEPT_SENSE_REGEX matches valid concept-sense strings', () => {
			expect(CONCEPT_SENSE_REGEX.test('love-A')).toBe(true)
			expect(CONCEPT_SENSE_REGEX.test('grace-B')).toBe(true)
			expect(CONCEPT_SENSE_REGEX.test('holy_spirit-A')).toBe(true)
			expect(CONCEPT_SENSE_REGEX.test('love')).toBe(false)
			expect(CONCEPT_SENSE_REGEX.test('love-1')).toBe(false)
			expect(CONCEPT_SENSE_REGEX.test('love-a')).toBe(false)
		})

		test('parse_concept_sense extracts stem and sense', () => {
			expect(parse_concept_sense('love-A')).toEqual({ stem: 'love', sense: 'A' })
			expect(parse_concept_sense('holy_spirit-Z')).toEqual({ stem: 'holy_spirit', sense: 'Z' })
			expect(parse_concept_sense('invalid')).toBeNull()
		})

		test('normalize_wildcards converts * and # wildcards to %', () => {
			expect(normalize_wildcards('lov*')).toBe('lov%')
			expect(normalize_wildcards('gr#ce')).toBe('gr%ce')
			expect(normalize_wildcards('*peace#')).toBe('%peace%')
			expect(normalize_wildcards('plain')).toBe('plain')
		})

		test('CONCEPT_UPDATE_KEY_REGEX matches concept form field updates', () => {
			expect(CONCEPT_UPDATE_KEY_REGEX.test('love-A-gloss')).toBe(true)
			expect(CONCEPT_UPDATE_KEY_REGEX.test('grace-B-definition')).toBe(true)
			expect(CONCEPT_UPDATE_KEY_REGEX.test('love-A')).toBe(false)
		})
	})

	describe('Scripture patterns & helpers', () => {
		test('USFM_VERSE_MARKER_REGEX matches verse tokens', () => {
			const text = '\\c 1 \\v 1 In the beginning \\v 2 was the Word'
			const matches = text.match(USFM_VERSE_MARKER_REGEX)
			expect(matches).toEqual(['\\v 1', '\\v 2'])
		})

		test('strip_gloss_classifiers removes dictionary tags', () => {
			expect(strip_gloss_classifiers('(universal primitive) to know')).toBe('to know')
			expect(strip_gloss_classifiers('(complex) father-in-law')).toBe('father-in-law')
			expect(strip_gloss_classifiers('(LDV) ancient')).toBe('ancient')
			expect(strip_gloss_classifiers('(inexplicable) unknown token')).toBe('unknown token')
			expect(strip_gloss_classifiers('regular gloss')).toBe('regular gloss')
		})
	})

	describe('URL patterns & helpers', () => {
		test('clean_trailing_slash strips single and multiple trailing slashes', () => {
			expect(clean_trailing_slash('http://localhost:5173/')).toBe('http://localhost:5173')
			expect(clean_trailing_slash('http://localhost:5173///')).toBe('http://localhost:5173')
			expect(clean_trailing_slash('http://localhost:5173')).toBe('http://localhost:5173')
			expect(clean_trailing_slash('/api/v1/')).toBe('/api/v1')
		})
	})
})
