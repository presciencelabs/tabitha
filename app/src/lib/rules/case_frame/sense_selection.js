import { find_result_index, set_message, set_token_concept } from '$lib/parser/token'
import { create_context_filter, create_token_filter } from '../rules_parser'

/** @typedef {[string, any]} SenseRules */

/**
 * These rules help decide which sense to select from the ones that match the argument structure.
 * They are ordered by priority, and can provide additional filtering of the verb or arguments to
 * narrow down the match.
 * A sense can also have multiple rows in case there are multiple incompatible filters to check.
 * TODO store these in the db
 * 
 * @type {[WordStem, SenseRules[]][]}
 */
const verb_sense_rules = [
	['ask', [
		['ask-B', { }],	// prioritize ask-B over ask-A
		['ask-D', { }],	// prioritize ask-D over ask-A
		['ask-F', { }],	// prioritize ask-F over ask-A
	]],
	['be', [
		// 'be' is very particular and so each sense is specified to make the priority clear. Not all verbs will need this.
		// For example, both be-I and be-F would match 'John is with Mary'
		// but be-I is more specific and should be selected over be-F.
		// senses with unique structures
		['be-A', { }],	// patient proposition
		['be-V', { }],	// agent proposition
		['be-E', { }],	// existential
		// senses with adpositions in 'state'
		['be-I', { }],	// accompaniment (with)
		['be-G', { }],	// benefactive
		['be-P', { }],	// depiction (about)
		['be-R', { }],	// partitive (part)
		['be-T', { }],	// place of origin (from)
		['be-U', { }],	// be like
		['be-H', { 'state': { 'stem': 'day|morning|afternoon|evening|Sabbath' } }],	// temporal TODO check features of word from lexicon
		['be-W', { 'state': { 'stem': 'family|tribe' } }],
		// senses with unique agents
		['be-J', { 'agent': { 'stem': 'date' } }],	// date
		['be-K', { 'agent': { 'stem': 'name' } }],	// name
		['be-N', { 'agent': { 'stem': 'time' } }],	// time
		['be-O', { 'agent': { 'stem': 'weather' } }],	// weather
		// senses with unique states
		['be-C', { 'state': {
			'stem': 'man|woman',
			'context': { 'precededby': [{ 'tag': { 'determiner': 'indefinite_article' }, 'skip': 'adjp_modifiers_attributive' }, { 'category': 'Adjective' }] },
		} }],	// class membership (eg. John is a wicked man)
		['be-Q', { 'state': { 'stem': 'bronze|clay|cloth|gold|iron|metal|sackcloth|silver|wood' } } ],	// substance (made of)
		['be-M', { 'state': { 'stem': 'ancestor|brother|child|daughter|descendant|father|husband|mother|sister|son|wife' } }],	// kinship
		['be-L', { 'state': { 'stem': 'apostle|captain|emperor|farmer|governor|judge|king|leader|officer|official|priest|prince|prophet|queen|ruler|servant|slave|teacher' } }],	// social role
		['be-S', { }],	// age
		['be-B', { }],	// equative
		['be-X', { }],	// metaphorical
		// senses with adjectives
		['be-D', { }],	// predicative
		['be-F', { }],	// general locative
	]],
	['become', [
		// 'become' is very particular and so each sense is specified to make the priority clear. Not all verbs will need this.
		['become-G', { }],	// become like
		['become-J', { }],	// metaphorical
		['become-F', { 'agent': { 'stem': 'weather' } }],	// weather
		['become-I', { 'state': { 'stem': 'day|morning|afternoon|evening|Sabbath' } }],	// temporal TODO check features of word from lexicon
		['become-H', { 'state': { 'stem': 'bronze|clay|cloth|gold|iron|metal|sackcloth|silver|wood' } } ],	// substance (made of)
		['become-E', { 'state': { 'stem': 'ancestor|brother|child|daughter|descendant|father|husband|mother|sister|son|wife' } }],	// kinship
		['become-C', { 'state': { 'stem': 'apostle|captain|emperor|farmer|governor|judge|king|leader|officer|official|priest|prince|prophet|queen|ruler|servant|slave|teacher' } }],	// social role
		['become-B', { }],	// class membership
		['become-D', { }],	// equative
		['become-A', { }],	// predicative
	]],
	['give', [
		['give-B', { 'patient': { 'stem': 'ring|vaccine' } }],
		// TODO add another give-B entry to use a lexicon feature to check for any person.
		['give-C', { 'patient': { 'stem': 'authority|law|name|peace|power|promise|skill|wisdom' } }],
	]],
	['go', [
		['go-B', { 'agent': { 'stem': 'border' } }],
	]],
	['have', [
		['have-H', { 'state': { 'stem': 'eunuch|man|servant|slave' } }],
		['have-G', { 'state': { 'stem': 'feast|party' } }],
		['have-F', { 'state': { 'stem': 'leaf|branch|wheel' } }],
		['have-D', { 'state': { 'stem': 'authority|custom|faith|hope|life|peace|power|problem|spirit|trouble' } }],
		['have-C', { 'state': { 'stem': 'wing|head|tooth|horn|eye|mouth|testicle' } }],
		['have-B', { 'state': { 'stem': 'ancestor|brother|child|cousin|daughter|descendant|family|father|father-in-law|husband|mother|mother-in-law|parent|relative|sister|son|wife' } }],
		['have-E', { 'state': { 'stem': 'AIDS|Avian-Influenza|cold|disease|fever|HIV|pain|sore|leprosy' } }],
		['have-A', { }],
		['have-I', { }],	// TODO use a lexicon feature to check for the agent being a place
	]],
	['know', [
		['know-C', { 'patient': { 'stem': 'law|meaning|name|secret|thing' } }],
	]],
	['leave', [
		['leave-B', { 'patient': { 'stem': 'father|king|man|Mary|Naomi|person|woman|Simon|Jesus|boy' } }],	// TODO use lexicon rules. these values were copied from the analyzer
	]],
	['live', [
		['live-B', { 'lifespan_oblique': { } }],
		['live-C', { 'just_like_clause': { } }],
	]],
	['make', [
		['make-C', { 'patient': { 'stem': 'command|fire|god|peace|promise|wave|covenant' } }],
		['make-E', { 'patient': { 'stem': 'bread|food' } }],
	]],
	['say', [
		['say-D', { 'agent': { 'stem': 'law' } }],
	]],
	['see', [
		['see-D', { 'patient': { 'stem': 'dream|vision' } }],
		['see-C', { }],	// prioritize see-C over see-B gets selected
	]],
	['send', [
		['send-B', { 'patient': { 'stem': 'letter|message' } }],
	]],
	['speak', [
		['speak-B', { }],	// prioritize speak-B over speak-A
	]],
	['take', [
		['take-B', { 'patient': { 'level': '4' } }], // TODO use a lexicon feature to check for any person.
		['take-B', { 'patient': { 'stem': 'person|man|woman|child|son|daughter' } }],
		['take-C', { 'patient': { 'stem': 'rooster|sheep|horse' } }],
		['take-D', { 'source': { 'stem': 'person|man|woman|child|son|daughter' } }], // TODO use a lexicon feature to check for any person.
		['take-E', { 'destination': { 'stem': 'person|man|woman|child|son|daughter' } }], // TODO use a lexicon feature to check for any person.
	]],
	['tell', [
		// prioritize tell-C over tell-A due to the presence of the 'about'. tell-A may count as valid if there is a relative clause on its patient.
		['tell-C', { }],
	]],
	['want', [
		['want-D', { 'patient': { 'stem': 'peace|health|life' } }],
	]],
]

/**
 * These rules help decide which sense to select from the ones that match the argument structure.
 * They are ordered by priority, and can provide additional filtering of the verb or arguments to
 * narrow down the match.
 * A sense can also have multiple rows in case there are multiple incompatible filters to check.
 * Many adjective sense B's have a nominal argument where sense A does not, so if sense B has a
 * valid argument, it needs to be entered here in order to prioritize it over sense A.
 * 
 * @type {[WordStem, SenseRules[]][]}
 */
const adjective_sense_rules = [
	['afraid', [['afraid-B', { }]]],
	['amazed', [['amazed-B', { }]]],
	['angry', [['angry-B', { }]]],
	['ashamed', [['ashamed-B', { }]]],
	['close', [['close-B', { }]]],
	['cruel', [['cruel-B', { }]]],
	['faithful', [
		['faithful-B', { }],
		// When faithful-C has a nominal argument, it should be prioritized over -A
		['faithful-C', { 'nominal_argument': { } }],
	]],
	['gentle', [['gentle-B', { }]]],
	['kind', [['kind-B', { }]]],
	['long', [
		['long-C', { }],
		['long-B', { 'nominal_argument': { 'stem': 'time' } }],
	]],
	['merciful', [['merciful-B', { }]]],
	['old', [['old-B', { }]]],
	['patient', [['patient-B', { }]]],
	['sad', [
		// Only when sad-B has a nominal argument should it be prioritized over sad-A
		['sad-B', { 'nominal_argument': { } }],
	]],
	['upset', [
		['upset-B', { }],
		['upset-C', { }],
	]],
	['wide', [['wide-B', { }]]],
]

/**
 * @param {SenseRules} sense_rules 
 * @returns {[WordSense, ArgumentMatchFilter]}
 */
function parse_sense_rule([sense, sense_rule_json]) {
	const role_filters = Object.entries(sense_rule_json).map(parse_sense_rule)
	return [sense, role_match => role_filters.every(filter => filter(role_match))]

	/**
	 * 
	 * @param {[RoleTag, any]} role_filter_json 
	 * @returns {ArgumentMatchFilter}
	 */
	function parse_sense_rule([role_tag, role_filter_json]) {
		const trigger = create_token_filter(role_filter_json)
		const context = create_context_filter(role_filter_json['context'])

		return role_matches => {
			const match_result = role_matches.find(match => match.role_tag === role_tag)
			if (!match_result) {
				return false
			}

			const { tokens, trigger_index, trigger_token } = match_result.trigger_context
			return trigger(trigger_token) && context(tokens, trigger_index).success
		}
	}
}

/** @type {Map<WordStem, [WordSense, ArgumentMatchFilter][]>} */
const VERB_SENSE_FILTER_RULES = new Map(verb_sense_rules.map(([stem, sense_rules]) => [stem, sense_rules.map(parse_sense_rule)]))
const ADJECTIVE_SENSE_FILTER_RULES = new Map(adjective_sense_rules.map(([stem, sense_rules]) => [stem, sense_rules.map(parse_sense_rule)]))

const SENSE_FILTER_RULES = new Map([
	['Verb', VERB_SENSE_FILTER_RULES],
	['Adjective', ADJECTIVE_SENSE_FILTER_RULES],
])

/**
 * 
 * @param {RuleTriggerContext} trigger_context 
 */
export function select_sense(trigger_context) {
	const token = trigger_context.trigger_token
	select_word_sense(token, trigger_context)

	if (token.complex_pairing) {
		select_word_sense(token.complex_pairing, trigger_context)
	}
}

/**
 * 
 * @param {Token} token
 * @returns {WordSense | undefined}
 */
function find_matching_sense(token) {
	if (!token.lookup_results.some(result => result.case_frame.is_checked)) {
		return undefined
	}
	
	const stem = token.lookup_results[0].stem
	const category = token.lookup_results[0].part_of_speech
	const sense_filters = SENSE_FILTER_RULES.get(category)?.get(stem) ?? []
	return sense_filters.find(sense_matches)?.[0]

	/**
	 * 
	 * @param {[WordSense, ArgumentMatchFilter]} sense_match_filters 
	 * @returns 
	 */
	function sense_matches([sense, match_filter]) {
		const result_index = find_result_index(token, sense)
		if (result_index === -1) {
			return false
		}

		const result = token.lookup_results[result_index]
		return result.case_frame.is_valid && match_filter(result.case_frame.valid_arguments)
	}
}

/**
 * 
 * @param {Token} token
 * @param {RuleTriggerContext} trigger_context
 */
function select_word_sense(token, trigger_context) {
	if (token.lookup_results.length === 0) {
		return
	}

	const stem = token.lookup_results[0].stem

	// Move the valid lookups to the top
	const valid_lookups = token.lookup_results.filter(result => result.case_frame.is_valid)
	const invalid_lookups = token.lookup_results.filter(result => !result.case_frame.is_valid)
	token.lookup_results = [...valid_lookups, ...invalid_lookups]
	
	// Use the matching valid sense, or else the first valid sense, or else sense A.
	// The lookups should already be ordered alphabetically so the first valid sense is the lowest letter
	const default_matching_sense = find_matching_sense(token)
		|| `${stem}-${valid_lookups.at(0)?.concept?.sense ?? 'A'}`

	const specified_sense = token.specified_sense ? `${stem}-${token.specified_sense}` : ''

	if (specified_sense === default_matching_sense) {
		set_message(trigger_context, { token_to_flag: token, suggest: 'Consider removing the sense, as it would be selected by default.', plain: true })
	}

	const sense_to_select = specified_sense ? specified_sense : default_matching_sense
	set_token_concept(token, sense_to_select)

	// apply the selected result's argument actions
	for (const valid_argument of token.lookup_results[0].case_frame.valid_arguments) {
		valid_argument.rule.trigger_rule.action(valid_argument.trigger_context)
	}
}
