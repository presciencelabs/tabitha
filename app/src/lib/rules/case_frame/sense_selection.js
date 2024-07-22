import { LOOKUP_FILTERS } from '$lib/lookup_filters'
import { set_message, split_stem_and_sense } from '$lib/parser/token'
import { create_context_filter, create_token_filter } from '../rules_parser'

/** @typedef {[string, any]} PriorityOverrideRules */

/**
 * By default, senses with valid case frames are prioritized by letter (eg. -A is selected over -B).
 * These rules allow overriding that priority based on filters applied to the verb arguments.
 * They are ordered by priority, where the first entry in the array has the most priority.
 * Note that not all senses have a rule, only those that are different from the default letter-based priority.
 * 
 * An empty filter means that sense will always apply as long as its case frame is valid.
 * A sense can also have multiple rows in case there are multiple incompatible filters to check. (see take-B)
 * 
 * The order of the priorities mostly makes sense when referring to the theta-grids in the Ontology,
 * as overlapping and compatible argument structures need to be considered.
 * 
 * TODO store these in the db
 * 
 * @type {[WordStem, PriorityOverrideRules[]][]}
 */
const verb_sense_priority_overrides = [
	['answer', [
		['answer-B', { 'patient': { 'stem': 'prayer' } }],
		['answer-C', { 'patient': { 'stem': 'question' } }],
	]],
	['appear', [
		['appear-B', { }],
	]],
	['ask', [
		['ask-B', { }],	
		['ask-D', { }],	
		['ask-F', { }],	
	]],
	['attack', [
		['attack-B', { 'agent': { 'stem': 'goat|lion|sheep' } }],
		['attack-C', { 'agent': { 'stem': 'child|person' } }],
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
		['become-F', { 'agent': { 'stem': 'weather' } }],	// weather
		['become-I', { 'state': { 'stem': 'day|morning|afternoon|evening|Sabbath' } }],	// temporal TODO check features of word from lexicon
		['become-H', { 'state': { 'stem': 'bronze|clay|cloth|gold|iron|metal|sackcloth|silver|wood' } } ],	// substance (made of)
		['become-E', { 'state': { 'stem': 'ancestor|brother|child|daughter|descendant|father|husband|mother|sister|son|wife' } }],	// kinship
		['become-C', { 'state': { 'stem': 'apostle|captain|emperor|farmer|governor|judge|king|leader|officer|official|priest|prince|prophet|queen|ruler|servant|slave|teacher' } }],	// social role
		['become-B', { }],	// class membership
		['become-D', { }],	// equative
		['become-J', { }],	// metaphorical
		['become-A', { }],	// predicative
	]],
	['believe', [
		['believe-B', { 'patient': { 'stem': 'Christ|God|Jesus' } }],
	]],
	['bring', [
		// TODO use a lexicon feature for bring-B to check for any person.
		['bring-B', { 'patient': { 'stem': 'baby|brother|child|girl|man|person|son|woman' } }],
		['bring-C', { 'patient': { 'stem': 'animal|cattle|chicken|cow|horse|goat' } }],
	]],
	['call', [
		['call-B', { }],
		['call-C', { }],
	]],
	['change', [
		['change-B', { 'patient': { } }],
	]],
	['cover', [
		['cover-C', { 'agent': { 'stem': 'cloud' } }],
	]],
	['dream', [
		['dream-A', { 'patient': { } }],	// when dream-A has a patient, prioritize it over dream-B
		['dream-B', { }],
	]],
	['give', [
		['give-B', { 'patient': { 'stem': 'ring|vaccine' } }],
		// TODO add another give-B entry to use a lexicon feature to check for any person.
		['give-C', { 'patient': { 'stem': 'authority|law|name|peace|power|promise|skill|wisdom' } }],
	]],
	['go', [
		['go-B', { 'agent': { 'stem': 'border' } }],
	]],
	['grow', [
		['grow-B', { 'up': {  } }],	// if 'up' is present, select grow-B
		['grow-D', { 'patient': { 'stem': 'food|crop' } }],
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
	['laugh', [
		['laugh-B', { }],
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
	['pray', [
		['pray-D', { }],
	]],
	['prepare', [
		['prepare-B', { 'patient': { 'stem': 'feast|food|meal' } }],
		['prepare-C', { }],
	]],
	['return', [
		['return-D', { 'destination': { 'stem': 'king|person' } }],
	]],
	['say', [
		['say-D', { 'agent': { 'stem': 'law' } }],
	]],
	['see', [
		['see-D', { 'patient': { 'stem': 'dream|vision' } }],
		['see-C', { }],
	]],
	['send', [
		['send-B', { 'patient': { 'stem': 'letter|message' } }],
	]],
	['speak', [
		['speak-B', { }],
	]],
	['take', [
		['take-B', { 'patient': { 'level': '4' } }], // TODO use a lexicon feature to check for any person.
		['take-B', { 'patient': { 'stem': 'person|man|woman|child|son|daughter' } }],
		['take-C', { 'patient': { 'stem': 'rooster|sheep|horse' } }],
		['take-D', { 'source': { 'stem': 'person|man|woman|child|son|daughter' } }], // TODO use a lexicon feature to check for any person.
		['take-E', { 'destination': { 'stem': 'person|man|woman|child|son|daughter' } }], // TODO use a lexicon feature to check for any person.
	]],
	['teach', [
		['teach-A', { 'patient': { } }],	// when teach-A has a patient, prioritize it over teach-B
		['teach-B', { 'patient': { 'stem': 'lesson|message|thing|law' } }],
		['teach-C', { }],
	]],
	['tell', [
		// prioritize tell-C over tell-A due to the presence of the 'about'. tell-A may count as valid if there is a relative clause on its patient.
		['tell-C', { }],
	]],
	['throw', [
		['throw-C', { }],
		['throw-D', { 'destination': { 'stem': 'ground|floor' } }],
		['throw-E', { 'destination': { 'stem': 'air' } }],
	]],
	['want', [
		['want-D', { 'patient': { 'stem': 'peace|health|life' } }],
	]],
	['worry', [
		['worry-B', { }],
	]],
]

/**
 * By default, senses with valid case frames are prioritized by letter (eg. -A is selected over -B).
 * These rules allow overriding that priority based on filters applied to the verb arguments.
 * They are ordered by priority, where the first entry in the array has the most priority.
 * Note that not all senses have a rule, only those that are different from the default letter-based priority.
 * 
 * An empty filter means that sense will always apply as long as its case frame is valid.
 * 
 * Many adjective sense B's have a nominal argument where sense A does not, so if sense B has a
 * valid argument, it needs to be entered here in order to prioritize it over sense A.
 * 
 * @type {[WordStem, PriorityOverrideRules[]][]}
 */
const adjective_sense_priority_overrides = [
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
	['proud', [['proud-B', { }]]],
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
 * @param {PriorityOverrideRules} sense_rules 
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
const VERB_SENSE_FILTER_RULES = new Map(verb_sense_priority_overrides.map(([stem, sense_rules]) => [stem, sense_rules.map(parse_sense_rule)]))
const ADJECTIVE_SENSE_FILTER_RULES = new Map(adjective_sense_priority_overrides.map(([stem, sense_rules]) => [stem, sense_rules.map(parse_sense_rule)]))

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
 * @returns {string | undefined} the sense letter or undefined
 */
function find_matching_sense(token) {
	if (!token.lookup_results.some(result => result.case_frame.is_checked)) {
		return undefined
	}
	
	const stem = token.lookup_results[0].stem
	const category = token.lookup_results[0].part_of_speech
	const sense_filters = SENSE_FILTER_RULES.get(category)?.get(stem) ?? []
	const matching_sense = sense_filters.find(sense_matches)?.[0]
	return matching_sense ? split_stem_and_sense(matching_sense).sense : undefined

	/**
	 * 
	 * @param {[WordSense, ArgumentMatchFilter]} sense_match_filters 
	 * @returns {boolean}
	 */
	function sense_matches([sense, match_filter]) {
		const result = token.lookup_results.find(LOOKUP_FILTERS.MATCHES_SENSE(split_stem_and_sense(sense)))
		if (!result) {
			return false
		}

		return result.case_frame.is_valid && match_filter(result.case_frame.valid_arguments)
	}
}

/**
 * 
 * @param {Token} token
 * @param {RuleTriggerContext} trigger_context
 */
function select_word_sense(token, trigger_context) {
	if (!token.lookup_results.some(LOOKUP_FILTERS.IS_IN_ONTOLOGY)) {
		return
	}

	const stem = token.lookup_results[0].stem

	// Move the valid lookups to the top
	const valid_lookups = token.lookup_results.filter(result => result.case_frame.is_valid)
	const invalid_lookups = token.lookup_results.filter(result => !result.case_frame.is_valid)
	token.lookup_results = [...valid_lookups, ...invalid_lookups]
	
	// Use the matching valid sense, or else the first valid sense, or else sense A.
	// The lookups should already be ordered alphabetically so the first valid sense is the lowest letter
	const default_matching_sense = find_matching_sense(token) ?? valid_lookups.at(0)?.sense ?? 'A'

	if (token.specified_sense && token.specified_sense === default_matching_sense) {
		set_message(trigger_context, { token_to_flag: token, suggest: 'Consider removing the sense, as it would be selected by default.', plain: true })
	}

	const sense_to_select = token.specified_sense || default_matching_sense
	
	// put the selected sense at the top of the results
	const selected_index = token.lookup_results.findIndex(LOOKUP_FILTERS.MATCHES_SENSE({ stem, sense: sense_to_select }))
	const selected_result = token.lookup_results.splice(selected_index, 1)[0]
	token.lookup_results = [selected_result, ...token.lookup_results]

	// apply the selected result's argument actions
	for (const valid_argument of selected_result.case_frame.valid_arguments) {
		valid_argument.rule.trigger_rule.action(valid_argument.trigger_context)
	}
}
