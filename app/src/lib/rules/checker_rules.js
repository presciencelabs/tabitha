import { ERRORS } from '$lib/parser/error_messages'
import { TOKEN_TYPE, create_added_token, format_token_message, set_error_message, set_suggest_message } from '$lib/parser/token'
import { REGEXES } from '$lib/regexes'
import { validate_case_frame } from './case_frame'
import { create_context_filter, create_token_filter, create_token_modify_action } from './rules_parser'

const checker_rules_json = [
	{
		'name': 'Check for "it" apart from an agent clause',
		'trigger': { 'tag': { 'syntax': 'agent_proposition_subject' } },
		'context': {
			'notfollowedby': { 'tag': { 'clause_type': 'agent_clause' }, 'skip': 'all' },
		},
		'require': {
			'message': 'Third person pronouns should be replaced with the Noun they represent, e.g., Paul (instead of him).',
		},
	},
	{
		'name': 'Expect an agent of a passive',
		'trigger': { 'category': 'Verb' },
		'context': {
			'precededby': { 'tag': { 'auxiliary': 'passive' }, 'skip': 'all' },
			'notfollowedby': { 'tag': [{ 'role': 'agent' }, { 'syntax': 'agent_of_passive' }], 'skip': 'all' },
		},
		'require': {
			'followedby': 'by X',
			'message': 'Missing agent of passive verb. Use _implicitActiveAgent if necessary.',
		},
	},
	{
		'name': 'Suggest avoiding the Perfect aspect',
		'trigger': { 'tag': { 'auxiliary': 'flashback' } },
		'suggest': {
			'message': 'The perfect is only allowed if it would have the right meaning if changed to the simple past tense with "recently" or "previously".',
		},
	},
	{
		'name': 'each other must be hyphenated',
		'trigger': { 'stem': 'each' },
		'context': {
			'followedby': { 'stem': 'other' },
			'notfollowedby': { 'category': 'Noun', 'skip': { 'category': 'Adjective' } },
		},
		'require': {
			'message': 'Reciprocal each-other must be hyphenated.',
		},
	},
	{
		'name': 'Suggest expanding \'there\' to \'at that place\' for clarity',
		'trigger': { 'token': 'There|there' },
		'context': { 'notfollowedby': { 'stem': 'be' } },	// TODO trigger on 'not tag existential' instead
		'suggest': {
			'message': 'Consider using \'at that place\' instead of \'there\', especially if a preposition other than \'at\' is wanted.',
		},
	},
	{
		'name': 'Suggest expanding \'here\' to \'at this place\' for clarity',
		'trigger': { 'token': 'Here|here' },
		'suggest': {
			'message': 'Consider using \'at this place\' instead of \'here\', especially if a preposition other than \'at\' is wanted.',
		},
	},
	{
		'name': 'Flag two verbs within the same sentence',
		'trigger': { 'category': 'Verb' },
		'context': {
			'precededby': { 'category': 'Verb', 'skip': 'all' },
		},
		'require': {
			'message': 'Cannot have multiple verbs in the same clause ({0:stem} and {stem}). Check for an unbracketed subordinate clause or consider splitting the sentence.',
		},
		'comment': 'See section 0.3 of the Phase 1 checklist',
	},
	{
		'name': 'Check for an Imperative Verb with no subject at the beginning of a sentence',
		'trigger': { 'category': 'Verb', 'form': 'stem', 'tag': { 'position': 'first_word' } },
		'require': {
			'precededby': 'You(X) (imp)',
			'message': 'An imperative clause must have an explicit subject.',
		},
	},
	{
		'name': 'Check for an Imperative Verb with no subject after a conjunction at the beginning of a sentence',
		'trigger': { 'category': 'Verb', 'form': 'stem' },
		'context': {
			'precededby': { 'category': 'Conjunction', 'tag': { 'position': 'first_word' } },
		},
		'require': {
			'precededby': 'you(X) (imp)',
			'message': 'An imperative clause must have an explicit subject.',
		},
	},
	{
		'name': 'Check for an imperative note in a non-quote subordinate clause',
		'trigger': { 'token': '(imp)' },
		'context': {
			'precededby': { 'token': '[', 'skip': 'all' },
			'notprecededby': { 'token': '"', 'skip': 'all' },
		},
		'require': {
			'message': 'Cannot mark complement clauses as imperative.',
		},
	},
	{
		'name': 'Check for "Let\'s"',
		'trigger': { 'token': 'Let\'s|let\'s' },
		'context': {
			'followedby': { 'category': 'Verb', 'skip': 'vp_modifiers' },
		},
		'require': {
			'message': 'Write \'We(X) {0:stem} _suggestiveLets\' instead. See P1 Checklist section 15.',
		},
	},
	{
		'name': 'Check for \'Let X...\'',
		'trigger': { 'token': 'Let' },
		'context': {
			'followedby': [{ 'category': 'Noun' }, { 'category': 'Verb', 'form': 'stem', 'skip': 'vp_modifiers' }],
		},
		'require': {
			'message': 'For the jussive write \'{0:token} {1:stem} (jussive) ...\' instead of \'Let {0:token} {1:stem}...\'. Or use \'(imp)\' for expressing permission. See P1 Checklist section 15.',
		},
	},
	{
		'name': 'Check for \'May X...\'',
		'trigger': { 'token': 'May' },
		'context': {
			'followedby': { 'category': 'Noun' },
		},
		'require': {
			'message': 'Write \'I(X) pray-hope [{0:token}...]\' instead. See P1 Checklist section 15.',
		},
	},
	{
		'name': 'Avoid using \'way\'',
		'trigger': { 'stem': 'way' },
		'suggest': {
			'message': 'Consider rewording to avoid the use of \'way\'. If that is impossible, you can still use it in the sense of means or method.',
		},
		'comment': 'See section X of the Phase 1 checklist',
	},
	{
		'name': 'Cannot use \'even\'',
		'trigger': { 'stem': 'even' },
		'require': {
			'message': 'Cannot use \'even\'. Simply omit it or reword the sentence to get the right emphasis. See P1 Checklist section 17.',
		},
		'comment': 'See section 17 of the Phase 1 checklist',
	},
	{
		'name': 'Cannot use \'any\'',
		'trigger': { 'stem': 'any' },
		'require': {
			'message': 'Cannot use \'any\'. Simply use \'a\' instead. See P1 Checklist section 17.',
		},
		'comment': 'See section 17 of the Phase 1 checklist',
	},
	{
		'name': 'Cannot use \'really\'',
		'trigger': { 'token': 'really' },
		'require': {
			'message': 'Cannot use \'really\'. Use \'actually\', \'truly\', \'very\', or \'much\' instead.',
		},
		'comment': 'See section 1 of the Phase 1 checklist',
	},
	{
		'name': 'Cannot say "X\'s own Y"',
		'trigger': { 'token': 'own' },
		'context': {
			'precededby': { 'tag': { 'relation': 'genitive_saxon' }, 'skip': { 'token': 'very' } },
			'followedby': { 'category': 'Noun', 'skip': 'np_modifiers' },
		},
		'require': {
			'message': 'Cannot write "{0:token} own {1:token}". Simply omit \'own\' or write "{0:token} _emphasized {1:token}" if desired. See P1 Checklist section 17.',
		},
		'comment': 'See section 17 of the Phase 1 checklist',
	},
	{
		'name': 'Avoid vague units of time',
		'trigger': { 'stem': 'short|long|some' },
		'context': {
			'precededby': { 'token': 'For|for', 'skip': { 'token': 'a' } },
			'followedby': { 'stem': 'time' },
		},
		'suggest': {
			'message': 'Try using more specific units of time (eg. \'for many years\') or express it in a different way (eg. \'for much time\').',
		},
	},
	{
		'name': 'Suggest a comma after "One day..."',
		'trigger': { 'stem': 'day' },
		'context': {
			'precededby': { 'token': 'One' },
			'followedby': [{ 'token': 'that' }, { 'category': 'Noun' }],
		},
		'suggest': {
			'followedby': ',',
			'message': 'Add a comma after \'One day\' so the \'that\' doesn\'t confuse the Analyzer.',
		},
		'comment': 'The Analyzer messes up "One day that man...", but it works fine with a comma. TODO handle other phrases too?',
	},
	{
		'name': 'Expect a [ before a relative clause',
		'trigger': { 'tag': { 'syntax': 'relativizer' } },
		'context': {
			'precededby': { 'category': 'Noun' },
		},
		'require': {
			'precededby': '[',
			'message': 'Missing bracket before relative or complement clause.',
		},
	},
	{
		// TODO check this via case frame/usage rules
		'name': 'Expect a [ before an adverbial clause',
		'trigger': { 'category': 'Adposition', 'usage': 'C' },
		'context': {
			'notprecededby': { 'token': '[', 'skip': { 'category': 'Conjunction' } },
		},
		'require': {
			'precededby': '[',
			'message': 'Missing bracket before adverbial clause.',
		},
	},
	{
		'name': 'Expect a [ before a quote',
		'trigger': { 'token': ',' },
		'context': {
			'followedby': { 'token': '"' },
		},
		'require': {
			'followedby': '[',
			'message': 'Missing bracket before an opening quote',
		},
	},
	{
		'name': 'Expect a , before a quote_begin clause',
		'trigger': { 'tag': { 'clause_type': 'patient_clause_quote_begin' } },
		'context': {
			'notprecededby': { 'token': ',' },
		},
		'require': {
			'precededby': ',',
			'message': 'Missing comma before an opening quote',
		},
	},
	{
		'name': '\'so\' in an Adverbial clause should be followed by \'that\'',
		'trigger': { 'token': 'so', 'category': 'Adposition' },
		'context': {
			'notfollowedby': { 'token': 'that' },
		},
		'suggest': {
			'message': 'Use \'so-that\' so-that it doesn\'t get mistaken for the Conjunction.',
		},
	},
	{
		'name': 'Check for unhyphenated Verbs with \'around\'',
		'trigger': { 'token': 'around' },
		'context': {
			'precededby': { 'stem': 'turn', 'category': 'Verb', 'skip': 'all' },
		},
		'require': {
			'message': '\'around\' must be hyphenated with the Verb (i.e. {0:stem}-around). DO NOT inflect the Verb (e.g. NOT turned-around).',
		},
	},
	{
		'name': 'Check for unhyphenated Verbs with \'away\'',
		'trigger': { 'token': 'away' },
		'context': {
			'precededby': { 'stem': 'chase|take|walk', 'category': 'Verb', 'skip': 'all' },
		},
		'require': {
			'message': '\'away\' must be hyphenated with the Verb (i.e. {0:stem}-away). DO NOT inflect the Verb (e.g. NOT took-away).',
		},
	},
	{
		'name': 'Check for unhyphenated Verbs with \'down\'',
		'trigger': { 'token': 'down' },
		'context': {
			'precededby': { 'stem': 'cut|knock|lie|run|sit|walk|write', 'category': 'Verb', 'skip': 'all' },
		},
		'require': {
			'message': '\'down\' must be hyphenated with the Verb (i.e. {0:stem}-down). DO NOT inflect the Verb (e.g. NOT ran-down).',
		},
	},
	{
		'name': 'Check for unhyphenated Verbs with \'off\'',
		'trigger': { 'token': 'off' },
		'context': {
			'precededby': { 'stem': 'cut|pull|take', 'category': 'Verb', 'skip': 'all' },
		},
		'require': {
			'message': '\'off\' must be hyphenated with the Verb (i.e. {0:stem}-off). DO NOT inflect the Verb (e.g. NOT took-off).',
		},
	},
	{
		'name': 'Check for unhyphenated \'put on\' (clothes)',
		'trigger': { 'stem': 'on' },
		'context': {
			'precededby': { 'stem': 'put', 'category': 'Verb' },
			'followedby': { 'stem': 'clothes|glove|sandal|shirt|shoe' },
		},
		'require': {
			'message': '\'on\' must be hyphenated with the Verb (i.e. put-on).',
		},
		'comment': 'The clothing-related nouns must be present because we don\'t want this rule applying to \'put on\' in general',
	},
	{
		'name': 'Check for unhyphenated Verbs with \'out\'',
		'trigger': { 'token': 'out' },
		'context': {
			'precededby': { 'stem': 'come|cry|pour|pull', 'category': 'Verb', 'skip': 'all' },
		},
		'require': {
			'message': '\'out\' must be hyphenated with the Verb (i.e. {0:stem}-out). DO NOT inflect the Verb (e.g. NOT cried-out).',
		},
	},
	{
		'name': 'Check for unhyphenated Verbs with \'up\'',
		'trigger': { 'token': 'up' },
		'context': {
			'precededby': { 'stem': 'go|pick|run|sit|stand|wake|walk', 'category': 'Verb', 'skip': 'all' },
		},
		'require': {
			'message': '\'up\' must be hyphenated with the Verb (i.e. {0:stem}-up). DO NOT inflect the Verb (e.g. NOT picked-up).',
		},
	},
	{
		'name': 'Some noun plurals aren\'t recognized',
		'trigger': { 'token': 'troubles|lands' },
		'require': {
			'message': 'TBTA does not use the plural \'{token}\'. Put \'_plural\' after the singular form to indicate plurality.',
		},
	},
	{
		'name': 'Don\'t allow \'what\' as a relativizer',
		'trigger': { 'token': 'what' },
		'context': {
			'precededby': { 'token': '[' },
			'notfollowedby': { 'token': '?', 'skip': 'all' },
		},
		'require': {
			'message': 'Cannot use \'what\' as a relativizer. Use \'the thing [that...]\' instead.',
		},
		'comment': 'See section 0.41 of the Phase 1 checklist',
	},
	{
		'name': 'Warn about using \'what\' instead of \'which thing\'',
		'trigger': { 'token': 'What|what' },
		'suggest': {
			'message': '\'what\' always becomes \'which thing-A\'. Consider writing \'which X\' if you want something different.',
		},
		'comment': 'See section 0.41 of the Phase 1 checklist',
	},
	{
		'name': 'Don\'t allow \'where\' as a relativizer',
		'trigger': { 'token': 'where' },
		'context': {
			'precededby': { 'token': '[' },
			'notfollowedby': { 'token': '?', 'skip': 'all' },
		},
		'require': {
			'message': 'Cannot use \'where\' as a relativizer. Use \'the place [that...]\' instead.',
		},
		'comment': 'See section 0.8 of the Phase 1 checklist',
	},
	// TODO Look outside the subordinate clause for 'time'. Currently this falsely flags a 'when' adverbial clause. 
	// {
	// 	'name': 'Don\'t allow \'when\' as a relativizer',
	// 	'trigger': { 'token': 'when' },
	// 	'context': {
	// 		'precededby': { 'token': '[' },
	// 		'notfollowedby': { 'token': '?', 'skip': 'all' },
	// 	},
	// 	'require': {
	// 		'message': 'Cannot use \'when\' as a relativizer. Use \'the time [that...]\' instead.',
	// 	},
	// 	'comment': 'See section 0.8 of the Phase 1 checklist.',
	// },
	{
		'name': 'Don\'t allow \'whose\' as a relativizer',
		'trigger': { 'token': 'whose' },
		'require': {
			'message': 'Cannot use \'whose\'. Use \'X [who had...]\' instead. See P1 Checklist section 6.',
		},
		'comment': 'See section 6 of the Phase 1 checklist',
	},
	{
		'name': 'Use \'all of\' rather than \'all\' for non-generic Nouns',
		'trigger': { 'stem': 'all' },
		'context': {
			'followedby': { 'tag': 'determiner' },
		},
		'require': {
			'followedby': 'of',
			'message': 'Use \'all of\', unless the modified Noun is generic. See P1 Checklist 0.17.',
		},
		'comment': 'Catches "all the|these|those people" but allows "all people"',
	},
	{
		'name': 'Cannot use aspect auxilliaries (eg start) without another Verb',
		'trigger': { 'stem': 'start|stop|continue|finish' },
		'context': {
			'notfollowedby': { 'category': 'Verb', 'skip': 'all' },
		},
		'require': {
			'message': 'Must use \'{stem}\' with another Verb. See P1 Checklist 0.19.',
		},
		'comment': 'See section 0.19 of the Phase 1 checklist.',
	},
	{
		'name': 'Must use \'X is able to\' instead of \'X can\'',
		'trigger': { 'token': 'can' },
		'require': {
			'message': 'Use \'be able [to...]\' instead of \'can\'. See P1 Checklist 2.1.',
		},
		'comment': 'See section 2.1 of the Phase 1 checklist.',
	},
	{
		'name': 'Cannot use \'could\' unless in a \'so\' adverbial clause',
		'trigger': { 'token': 'could' },
		'context': {
			'notprecededby': [{ 'token': '[' }, { 'stem': 'so', 'skip': 'all' }],
		},
		'require': {
			'message': 'Use \'be able [to...]\' instead of \'could\', unless in a \'so-that\' clause. See P1 Checklist 2.1.',
		},
		'comment': 'See section 2.1 of the Phase 1 checklist.',
	},
	{
		'name': 'Cannot use \'is going to\' as a future marker',
		'trigger': { 'token': 'going' },
		'context': {
			'followedby': [{ 'token': 'to' }, { 'category': 'Verb' }],
		},
		'require': {
			'message': 'Use \'will {1:stem}\' instead of \'going to {1:token}\' to express future tense. See P1 Checklist 0.28.',
		},
		'comment': 'See section 0.28 of the Phase 1 checklist.',
	},
	{
		'name': 'Cannot use \'is to {Verb}\' as an obligation',
		'trigger': { 'stem': 'be' },
		'context': {
			'followedby': [{ 'token': 'to' }, { 'category': 'Verb' }],
		},
		'require': {
			'message': 'Use \'will\', \'must\', or \'should\' instead of \'{token} to...\' to express a future obligation.',
		},
	},
	{
		'name': 'Cannot use \'have to {Verb}\' as an obligation',
		'trigger': { 'stem': 'have' },
		'context': {
			'followedby': [{ 'token': 'to' }, { 'category': 'Verb' }],
		},
		'require': {
			'message': 'Use \'must\' or \'should\' instead of \'{token} to...\' to express an obligation.',
		},
	},
	{
		'name': 'Warn that \'come\' cannot be used for events, only things that move',
		'trigger': { 'stem': 'come' },
		'suggest': {
			'message': 'Note that \'come\' can only be used for things that move, NOT for events.',
		},
	},
	{
		'name': 'Cannot have two conjunctions to begin a sentence',
		'trigger': { 'category': 'Conjunction' },
		'context': {
			'precededby': { 'category': 'Conjunction' },
		},
		'require': {
			'message': 'Cannot use two conjunctions. Pick the one that is most meaningful.',
		},
	},
	{
		'name': 'Cannot use \'now\' as a conjuntion to start a sentence',
		'trigger': { 'token': 'Now', 'tag': { 'position': 'first_word' } },
		'suggest': {
			'message': "Note TBTA does not have the discourse marker 'now', only the adverb 'now' meaning 'at the present time'.",
		},
	},
	{
		'name': 'Suggest using an attributive Adjective instead of a predicative relative clause',
		'trigger': { 'tag': { 'syntax': 'predicate_adjective' } },
		'context': {
			'precededby': { 'tag': { 'syntax': 'relativizer' }, 'skip': 'all' },
		},
		'suggest': {
			'message': 'Consider writing \'{stem} X\' instead of \'X [{0:token} be {stem}]\'. The attributive adjective is generally preferred over a relative clause.',
		},
	},
]

/** @type {BuiltInRule[]} */
const builtin_checker_rules = [
	{
		name: 'Check capitalization for first word in a sentence or quote',
		comment: '',
		rule: {
			trigger: create_token_filter({ 'tag': { 'position': 'first_word' } }),
			context: create_context_filter({}),
			action: create_token_modify_action(token => {
				const token_to_test = token.pronoun ? token.pronoun : token
				if (REGEXES.STARTS_LOWERCASE.test(token_to_test.token) && !token_to_test.error_message) {
					set_error_message(token_to_test, ERRORS.FIRST_WORD_NOT_CAPITALIZED)
				}
			}),
		},
	},
	{
		name: 'Check that level 3 words are within a (complex) alternate',
		comment: '',
		rule: {
			trigger: create_token_filter({ 'level': '3' }),
			context: create_context_filter({ 'notprecededby': { 'token': '(complex)', 'skip': 'all' } }),
			action: create_token_modify_action(token => {
				set_error_message(token, ERRORS.WORD_LEVEL_TOO_HIGH)
			}),
		},
	},
	{
		name: 'Check that level 2 words are not on their own',
		comment: '',
		rule: {
			trigger: create_token_filter({ 'level': '2' }),
			context: create_context_filter({}),
			action: create_token_modify_action(token => {
				set_error_message(token, ERRORS.WORD_LEVEL_TOO_HIGH)
			}),
		},
	},
	{
		name: 'Check word complexity level of pairings',
		comment: '',
		rule: {
			trigger: token => token.complex_pairing !== null,
			context: create_context_filter({}),
			action: create_token_modify_action(token => {
				// the simple word should never be level 2 or 3
				if (check_token_level(is_level_complex)(token)) {
					set_error_message(token, ERRORS.WORD_LEVEL_TOO_HIGH)
				}

				// the complex word should never be level 0 or 1
				if (token.complex_pairing && check_token_level(is_level_simple)(token.complex_pairing)) {
					set_error_message(token.complex_pairing, ERRORS.WORD_LEVEL_TOO_LOW)
				}
			}),
		},
	},
	{
		name: 'Warn user if the word\'s complexity is ambiguous',
		comment: '',
		rule: {
			trigger: token => token.type === TOKEN_TYPE.LOOKUP_WORD,
			context: create_context_filter({}),
			action: create_token_modify_action(token => {
				// Alert if the first result is complex and there are also non-complex results (including proper nouns - see 'ark')
				// If the first result is already simple, that will be selected by default and thus not ambiguous.
				// Level 2 and 3 words are treated differently, so a combination of the two should also be ambiguous - see 'kingdom'
				if (check_ambiguous_level(is_level(2))(token) || check_ambiguous_level(is_level(3))(token)) {
					set_suggest_message(token, ERRORS.AMBIGUOUS_LEVEL)
				}

				const pairing = token.complex_pairing
				if (!pairing) {
					return
				}

				// Alert if the first result is simple and there are also complex results (see 'son')
				// If the first result is already complex, that will be selected by default and thus not ambiguous
				if (check_ambiguous_level(is_level_simple)(pairing)) {
					set_suggest_message(pairing, ERRORS.AMBIGUOUS_LEVEL)
				}
			}),
		},
	},
	{
		name: 'Check for words not in the ontology',
		comment: '',
		rule: {
			trigger: token => token.type === TOKEN_TYPE.LOOKUP_WORD,
			context: create_context_filter({}),
			action: create_token_modify_action(token => {
				check_lookup_results(token)

				if (token.complex_pairing) {
					check_lookup_results(token.complex_pairing)
				}
			}),
		},
	},
	{
		name: 'Check argument structure/case frame',
		comment: 'case frame rules can eventually be used for verbs, adjectives, adverbs, adpositions, and even conjunctions',
		rule: {
			trigger: create_token_filter({ 'category': 'Verb' }),
			context: create_context_filter({ }),
			action: (tokens, trigger_index) => {
				validate_case_frame(tokens, trigger_index)
				return trigger_index + 1
			},
		},
	},
	{
		name: 'Check for an errant \'that\' in a complement clause',
		comment: 'While TBTA sometimes accepts it, using "that" as a complementizer is too inconsistent and so is not allowed in P1',
		rule: {
			trigger: create_token_filter({ 'tag': { 'clause_type': 'patient_clause_different_participant|agent_clause' } }),
			context: create_context_filter({
				'subtokens': { 'token': 'that', 'skip': { 'token': '[' } },
			}),
			action: create_token_modify_action(token => {
				set_suggest_message(token.sub_tokens[1], 'Unless this \'that\' is supposed to be a demonstrative, consider removing it. Avoid using \'that\' as a complementizer in general.')
			}),
		},
	},
	{
		name: 'Check for a relative clause that might supposed to be a complement clause',
		comment: 'While TBTA sometimes accepts it, using "that" as a complementizer is too inconsistent and so is not allowed in P1',
		rule: {
			trigger: create_token_filter({ 'tag': { 'clause_type': 'relative_clause_that' } }),
			context: create_context_filter({
				'precededby': { 'category': 'Verb', 'skip': 'all' },
			}),
			action: (tokens, trigger_index, { context_indexes }) => {
				const verb_token = tokens[context_indexes[0]]
				const case_frames = verb_token.lookup_results.map(result => result.case_frame)
				if (case_frames.length === 0 || case_frames[0].is_valid) {
					return trigger_index + 1
				}
				const missing_arguments = new Set(case_frames.flatMap(case_frame => case_frame.missing_arguments.map(rule => rule.role_tag)))

				// Only show the message if all senses are invalid, but some are missing a patient clause
				if (['agent_clause', 'patient_clause_different_participant'].some(role => missing_arguments.has(role))) {
					const that_token = tokens[trigger_index].sub_tokens[1]
					set_suggest_message(that_token, 'This is being interpreted as a relative clause. If it\'s supposed to be a complement clause, remove the \'that\'.')
				}
				return trigger_index + 1
			},
		},
	},
	{
		name: 'Warn when there is no clause with (simple) after a clause with (complex)',
		comment: 'a simple alternate should (usually) follow a complex alternate',
		rule: {
			trigger: create_token_filter({ 'type': TOKEN_TYPE.CLAUSE }),
			context: create_context_filter({
				'subtokens': { 'token': '(complex)', 'skip': 'all' },
			}),
			action: (tokens, trigger_index, context_result) => {
				const next_clause_index = trigger_index + 1
				const next_clause_context_filter = create_context_filter({
					'subtokens': { 'token': '(simple)', 'skip': 'all' },
				})

				if (next_clause_index >= tokens.length || !next_clause_context_filter(tokens, next_clause_index).success) {
					const complex_token = tokens[trigger_index].sub_tokens[context_result.subtoken_indexes[0]]
					set_suggest_message(complex_token, 'A simple vocabulary alternate typically directly follows a complex alternate, but no simple alternate was found.')
				}

				return trigger_index + 1
			},
		},
	},
]

/**
 *
 * @param {any} rule_json
 * @returns {TokenRule}
 */
export function parse_checker_rule(rule_json) {
	const trigger = create_token_filter(rule_json['trigger'])
	const context = create_context_filter(rule_json['context'])

	// one of these has to be present, but not both
	const require_json = rule_json['require']
	const suggest_json = rule_json['suggest']
	const action = require_json ? checker_require_action(require_json) : checker_suggest_action(suggest_json)

	return {
		trigger,
		context,
		action,
	}

	/**
	 * 
	 * @param {CheckerAction} require
	 * @returns {RuleAction}
	 */
	function checker_require_action(require) {
		return (tokens, trigger_index, context_result) => {
			const formatted_message = format_token_message(tokens[trigger_index], require.message, { tokens, context_result })

			// The action will have a precededby, followedby, or neither. Never both.
			if (require.precededby) {
				tokens.splice(trigger_index, 0, create_added_token(require.precededby, { error: formatted_message }))
				return trigger_index + 2
			}
			if (require.followedby) {
				tokens.splice(trigger_index + 1, 0, create_added_token(require.followedby, { error: formatted_message }))
				return trigger_index + 2
			}

			tokens[trigger_index].error_message = formatted_message
			return trigger_index + 1
		}
	}

	/**
	 * 
	 * @param {CheckerAction} suggest
	 * @returns {RuleAction}
	 */
	function checker_suggest_action(suggest) {
		return (tokens, trigger_index, context_result) => {
			const formatted_message = format_token_message(tokens[trigger_index], suggest.message, { tokens, context_result })

			// The action will have a precededby, followedby, or neither. Never both.
			if (suggest.precededby) {
				tokens.splice(trigger_index, 0, create_added_token(suggest.precededby, { suggest: formatted_message }))
				return trigger_index + 2
			}
			if (suggest.followedby) {
				tokens.splice(trigger_index + 1, 0, create_added_token(suggest.followedby, { suggest: formatted_message }))
				return trigger_index + 2
			}

			tokens[trigger_index].suggest_message = formatted_message
			return trigger_index + 1
		}
	}
}

export const CHECKER_RULES = builtin_checker_rules.map(({ rule }) => rule).concat(checker_rules_json.map(parse_checker_rule))

/**
 * 
 * @param {(result: OntologyResult?) => boolean} level_check 
 * @returns {TokenFilter}
 */
function check_token_level(level_check) {
	return token => {
		return token.lookup_results.length > 0
			&& token.lookup_results.every(result => level_check(result.concept))
	}
}
/**
 * 
 * @param {(result: OntologyResult?) => boolean} level_check 
 * @returns {TokenFilter}
 */
function check_ambiguous_level(level_check) {
	return token => {
		return token.lookup_results.length > 0
			&& level_check(token.lookup_results[0].concept)
			&& token.lookup_results.filter(result => result.concept).some(result => !level_check(result.concept))
	}
}

/**
 * 
 * @param {Token} token 
 */
function check_lookup_results(token) {
	if (token.lookup_results.some(result => result.concept !== null && result.concept.id !== '0')) {
		return
	}

	if (token.lookup_results.at(0)?.concept?.id === '0') {
		set_suggest_message(token, 'The {category} \'{stem}\' is not yet in the Ontology, but should be soon. Consult the How-To document for more info.')

	} else if (token.lookup_results.some(result => result.how_to.length > 0)) {
		set_error_message(token, 'The {category} \'{stem}\' is not in the Ontology. Hover over the word for hints from the How-To document.')
		
	} else {
		set_suggest_message(token, '\'{token}\' is not in the Ontology, or its form is not recognized. Consult the How-To document or consider using a different word.')
	}
}

/**
 * 
 * @param {number} level 
 * @returns {(concept: OntologyResult?) => boolean}
 */
function is_level(level) {
	return concept => concept?.level === level
}

/**
 * 
 * @param {OntologyResult?} result 
 */
function is_level_simple(result) {
	return is_level(0)(result) || is_level(1)(result)
}

/**
 * 
 * @param {OntologyResult?} result 
 */
function is_level_complex(result) {
	return is_level(2)(result) || is_level(3)(result)
}
