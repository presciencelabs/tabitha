import { describe, expect, test } from 'vitest'
import { phrasify } from './phrasify'
import { parse } from '$lib/parser'
import { flatten_sentences } from '$lib/parser/clausify'

/**
 * @param {Object} param
 * @param {string} [param.input_text]
 * @param {string} [param.expected_text]
 */
async function test_phrasify({ input_text='', expected_text='' }) {
	const test_sentences = await parse(input_text)
	const expected_tokens = expected_text.split(' ')

	const result_tokens = flatten_sentences(phrasify(test_sentences))
	expect(result_tokens.length).toEqual(expected_tokens.length)
	for (let i = 0; i < result_tokens.length; i++) {
		expect(result_tokens[i].token).toBe(expected_tokens[i])
	}
}

describe('phrasify', () => {
	test('Daniel prayed to God many times.', async () => {
		await test_phrasify({
			input_text: 'Daniel prayed to God many times.',
			expected_text: '{NP Daniel } {VP prayed } {NP to God } {NP {AdjP many } times } .',
		})
	})
	test('John should quickly go to the house of the tall man.', async () => {
		await test_phrasify({
			input_text: 'John should quickly go to the house of the tall man.',
			expected_text: '{NP John } should {AdvP quickly } {VP go } {NP to the house {NP of the {AdjP tall } man } } .',
		})
	})
	test("The man [who John knows] wants [to see the king's wood table].", async () => {
		await test_phrasify({
			input_text: "The man [who John knows] wants [to see the king's wood table].",
			expected_text: "{NP The man [ who {NP John } {VP knows } {NP GAP_REL } ] } {VP wants } [ {NP GAP_SAME_SUB } {VP to see } {NP {NP the king's } {NP wood } table } ] .",
		})
	})
	test("The top of John's big house is red.", async () => {
		await test_phrasify({
			input_text: "The top of John's big house is red.",
			expected_text: "{NP The top {NP of {NP John's } {AdjP big } house } } {VP is } {AdjP red } .",
		})
	})
	test("Some of those students' books are heavier than John's books.", async () => {
		await test_phrasify({
			input_text: "Some of those students' books are heavier than John's books.",
			expected_text: "{NP {AdjP Some of } {NP those students' } books } {VP are } {AdjP heavier {NP than {NP John's } books } } .",
		})
	})
	test("That snake was thrown by Michael and by Michael's servants out of heaven.", async () => {
		await test_phrasify({
			input_text: "That snake was thrown by Michael and by Michael's servants out of heaven.",
			expected_text: "{NP That snake } {VP was thrown } {NP by Michael } {NP and by {NP Michael's } servants } out {NP of heaven } .",
		})
	})
	test('John has faith in God named Yahweh.', async () => {
		await test_phrasify({
			input_text: 'John has faith in God named Yahweh.',
			expected_text: '{NP John } {VP has } {NP faith {NP in God {NP named Yahweh } } } .',
		})
	})
	test('John is kind to Mary.', async () => {
		await test_phrasify({
			input_text: 'John is kind to Mary.',
			expected_text: '{NP John } {VP is } {AdjP kind {NP to Mary } } .',
		})
	})
	test("Paul's books are heavier than John's books.", async () => {
		await test_phrasify({
			input_text: "Paul's books are heavier than John's books.",
			expected_text: "{NP {NP Paul's } books } {VP are } {AdjP heavier {NP than {NP John's } books } } .",
		})
	})
	test('The house is 10 meters tall.', async () => {
		await test_phrasify({
			input_text: 'The house is 10 meters tall.',
			expected_text: '{NP The house } {VP is } {AdjP {NP {AdjP 10 } meters } tall } .',
		})
	})
	test("Those 10 people's books are big.", async () => {
		await test_phrasify({
			input_text: "Those 10 people's books are big.",
			expected_text: "{NP {NP Those {AdjP 10 } people's } books } {VP are } {AdjP big } .",
		})
	})
	test("John's black wood table's legs are tall.", async () => {
		await test_phrasify({
			input_text: "John's black wood table's legs are tall.",
			expected_text: "{NP {NP {NP John's } {AdjP black } {NP wood } table's } legs } {VP are } {AdjP tall } .",
		})
	})
	test('John should not have been going to Jerusalem.', async () => {
		await test_phrasify({
			input_text: 'John should not have been going to Jerusalem.',
			expected_text: '{NP John } {VP should not have been going } {NP to Jerusalem } .',
		})
	})
	test('John did not start to go to Jerusalem.', async () => {
		await test_phrasify({
			input_text: 'John did not start to go to Jerusalem.',
			expected_text: '{NP John } {VP did not start to go } {NP to Jerusalem } .',
		})
	})
	test('John was not happy.', async () => {
		await test_phrasify({
			input_text: 'John was not happy.',
			expected_text: '{NP John } {VP was not } {AdjP happy } .',
		})
	})
	test('John did not want [to leave].', async () => {
		await test_phrasify({
			input_text: 'John did not want [to leave].',
			expected_text: '{NP John } {VP did not want } [ {NP GAP_SAME_SUB } {VP to leave } ] .',
		})
	})
	test("Those things were given/entrusted by God _implicitActiveAgent to God's _implicit holy people.", async () => {
		await test_phrasify({
			input_text: "Those things were given by God _implicitActiveAgent to God's _implicit holy people.",
			expected_text: "{NP Those things } {VP were given } {NP by God _implicitActiveAgent } {NP to {NP God's _implicit } {AdjP holy } people } .",
		})
	})
	test("I(Jesus) am standing at your(follower's) _implicit door.", async () => {
		await test_phrasify({
			input_text: "I(Jesus) am standing at your(follower's) _implicit door.",
			expected_text: "{NP Jesus } {VP am standing } {NP at {NP follower's _implicit } door } .",
		})
	})
})