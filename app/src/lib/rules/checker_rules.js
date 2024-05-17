import { ERRORS } from '$lib/parser/error_messages'
import { TOKEN_TYPE, create_added_token, format_token_message, get_message_type, is_one_part_of_speech, set_message_plain } from '$lib/parser/token'
import { REGEXES } from '$lib/regexes'
import { validate_case_frame } from './case_frame'
import { create_context_filter, create_token_filter, message_set_action } from './rules_parser'

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
	// TODO make an error again when certain passive-like verbs are dealt with better (eg. united-C with, married with, locked, etc, see #105)
	{
		'name': 'Expect an agent of a passive',
		'trigger': { 'category': 'Verb' },
		'context': {
			'precededby': { 'tag': { 'auxiliary': 'passive' }, 'skip': 'all' },
			'notfollowedby': { 'tag': [{ 'role': 'agent' }, { 'syntax': 'agent_of_passive' }], 'skip': 'all' },
		},
		'suggest': {
			'followedby': 'by X',
			'message': 'If this is a passive Verb, make sure to include an explicit agent. Use _implicitActiveAgent if necessary.',
		},
		'comment': 'A passive verb requires a "by X" agent. Some verbs that look like passives aren\'t actually passives, so make this a suggestion instead of error.',
	},
	{
		'name': 'Suggest avoiding the Perfect aspect',
		'trigger': { 'tag': { 'auxiliary': 'flashback' } },
		'info': {
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
		'context': { 'notfollowedby': { 'stem': 'be', 'skip': 'vp_modifiers' } },	// TODO trigger on 'not tag existential' instead
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
		'warning': {
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
	{
		'name': 'Don\'t allow \'when\' as a relativizer',
		'trigger': { 'type': TOKEN_TYPE.CLAUSE },
		'context': {
			'precededby': { 'token': 'time' },
			'subtokens': { 'token': 'when', 'skip': { 'token': '[' } },
		},
		'require': {
			'on': 'subtokens:0',
			'message': 'Cannot use \'when\' as a relativizer. Use \'the time [that...]\' instead. See P1 Checklist 0.8.',
		},
		'comment': 'See section 0.8 of the Phase 1 checklist.',
	},
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
		'warning': {
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
		'warning': {
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
	{
		'name': 'Check for an errant \'that\' in a complement clause',
		'trigger': { 'tag': { 'clause_type': 'patient_clause_different_participant|agent_clause' } },
		'context': {
			'subtokens': { 'token': 'that', 'skip': { 'token': '[' } },
		},
		'suggest': {
			'on': 'subtokens:0',
			'message': 'Unless this \'that\' is supposed to be a demonstrative, consider removing it. Avoid using \'that\' as a complementizer in general.',
		},
		'comment': 'While TBTA sometimes accepts it, using "that" as a complementizer is too inconsistent and so is not allowed in P1',
	},
	{
		'name': 'Don\'t allow passives in \'same subject\' patient clauses',
		'trigger': { 'tag': { 'clause_type': 'patient_clause_same_participant' } },
		'context': {
			'precededby': { 'category': 'Verb', 'skip': 'all' },
			'subtokens': { 'tag': { 'auxiliary': 'passive' }, 'skip': 'all' },
		},
		'require': {
			'on': 'subtokens:0',
			'message': 'Cannot use a passive within this patient clause because its subject is required to be the same as the outer Verb. Try making the subject explicit, or reword the sentence. See P1 Checklist 24.',
		},
		'comment': 'eg. John wanted XX[to be seen by Mary]XX.',
	},
	{
		'name': 'Don\'t allow passives in \'in-order-to\' adverbial clauses',
		'trigger': { 'tag': { 'auxiliary': 'passive' } },
		'context': {
			'precededby': { 'stem': 'in-order-to', 'skip': 'all' },
		},
		'require': {
			'message': "Cannot use a passive within an 'in-order-to' clause because its subject is required to be the same as the outer Verb. Consider using 'so-that' instead. See P1 Checklist 24.",
		},
		'comment': 'eg. John went to the market XX[in-order-to be seen by Mary]XX.',
	},
	{
		'name': 'Don\'t allow passives in \'by\' adverbial clauses',
		'trigger': { 'tag': { 'auxiliary': 'passive' } },
		'context': {
			'precededby': { 'stem': 'by', 'skip': 'all' },
		},
		'require': {
			'message': "Cannot use a passive within a 'by' clause because its subject is required to be the same as the outer Verb. Consider using 'because' instead. See P1 Checklist 24.",
		},
		'comment': 'eg. John went to the market XX[by being taken by Mary]XX.',
	},
	{
		'name': "Don't allow negatives with 'purpose' adverbial clauses",
		'trigger': { 'tag': { 'clause_type': 'adverbial_clause' } },
		'context': {
			'precededby': { 'tag': { 'verb_polarity': 'negative' }, 'skip': 'all' },
			'subtokens': { 'stem': 'in-order-to|because|so', 'skip': [{ 'token': '[' }, { 'category': 'Conjunction' }] },
		},
		'warning': {
			'on': 'context:0',
			'message': "Avoid using a negative verb outside a clause expressing cause or purpose, as the scope of the 'not' is ambiguous. See P1 Checklist 27 for suggestions.",
		},
		'comment': "See Phase 1 Checklist section 27. eg 'John did not go [in-order-to buy food].' - does this mean he didn't go at all or he went for a different reason?",
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
			action: message_set_action(({ trigger_token: token }) => {
				const token_to_test = token.pronoun ? token.pronoun : token
				if (REGEXES.STARTS_LOWERCASE.test(token_to_test.token)) {
					return { token_to_flag: token_to_test, error: ERRORS.FIRST_WORD_NOT_CAPITALIZED }
				}
			}),
		},
	},
	{
		name: 'Check that level 3 words are within a (complex) alternate',
		comment: 'The complex word may be in a nested clause within the clause that has the (complex) tag',
		rule: {
			trigger: create_token_filter({ 'level': '3' }),
			context: create_context_filter({ 'notprecededby': { 'token': '(complex)', 'skip': 'all' } }),
			action: message_set_action(() => {
				return {}
				// TODO Re-enable when we support looking out from nested clauses.
				// return { error: ERRORS.WORD_LEVEL_TOO_HIGH }
			}),
		},
	},
	{
		name: 'Check that level 2 words are not on their own',
		comment: '',
		rule: {
			trigger: check_token_level(is_level(2)),
			context: create_context_filter({}),
			action: message_set_action(() => ({ error: ERRORS.WORD_LEVEL_TOO_HIGH })),
		},
	},
	{
		name: 'Check word complexity level of pairings',
		comment: '',
		rule: {
			trigger: token => token.complex_pairing !== null,
			context: create_context_filter({}),
			action: message_set_action(function* ({ trigger_token: token }) {
				// the simple word should never be level 2 or 3
				if (check_token_level(is_level_complex)(token)) {
					yield { error: ERRORS.WORD_LEVEL_TOO_HIGH }
				}

				// the complex word should never be level 0 or 1
				if (token.complex_pairing && check_token_level(is_level_simple)(token.complex_pairing)) {
					yield { token_to_flag: token.complex_pairing, error: ERRORS.WORD_LEVEL_TOO_LOW }
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
			action: message_set_action(function* ({ trigger_token: token }) {
				// Alert if the first result is complex and there are also non-complex results (including proper nouns - see 'ark')
				// If the first result is already simple, that will be selected by default and thus not ambiguous.
				// Level 2 and 3 words are treated differently, so a combination of the two should also be ambiguous - see 'kingdom'
				if (check_ambiguous_level(is_level(2))(token) || check_ambiguous_level(is_level(3))(token)) {
					yield { warning: ERRORS.AMBIGUOUS_LEVEL }
				}

				// Alert if the first result is simple and there are also complex results (see 'son')
				// If the first result is already complex, that will be selected by default and thus not ambiguous
				if (token.complex_pairing && check_ambiguous_level(is_level_simple)(token.complex_pairing)) {
					yield { token_to_flag: token.complex_pairing, warning: ERRORS.AMBIGUOUS_LEVEL }
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
			action: message_set_action(function* ({ trigger_token: token }) {
				yield* check_lookup_results(token)

				if (token.complex_pairing) {
					yield* check_lookup_results(token.complex_pairing)
				}
			}),
		},
	},
	{
		name: 'Check for words with ambiguous parts of speech',
		comment: '',
		rule: {
			trigger: token => token.type === TOKEN_TYPE.LOOKUP_WORD && !is_one_part_of_speech(token),
			context: create_context_filter({}),
			action: message_set_action(function* () {
				yield { warning: 'The editor cannot determine which part of speech this word is, so some errors and warnings within the same clause may not be accurate.' }
				yield { suggest: "Add '_noun', '_verb', '_adj', '_adv', '_adp', or '_conj' after '{token}' if you want the editor to check the syntax more accurately." }
			}),
		},
	},
	{
		name: 'Check argument structure/case frame',
		comment: 'case frame rules can eventually be used for verbs, adjectives, adverbs, adpositions, and even conjunctions',
		rule: {
			trigger: token => token.lookup_results.length > 0,
			context: create_context_filter({ }),
			action: message_set_action(validate_case_frame),
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
			action: message_set_action(({ tokens, trigger_token, context_indexes }) => {
				const verb_token = tokens[context_indexes[0]]
				const case_frames = verb_token.lookup_results.map(result => result.case_frame)
				if (case_frames.length === 0 || case_frames[0].is_valid) {
					return
				}
				const missing_arguments = new Set(case_frames.flatMap(case_frame => case_frame.missing_arguments.map(rule => rule.role_tag)))

				// Only show the message if all senses are invalid, but some are missing a patient clause
				if (['agent_clause', 'patient_clause_different_participant'].some(role => missing_arguments.has(role))) {
					const that_token = trigger_token.sub_tokens[1]
					return {
						token_to_flag: that_token,
						warning: 'This is being interpreted as a relative clause. If it\'s supposed to be a complement clause, remove the \'that\'.',
					}
				}
			}),
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
			action: message_set_action(({ tokens, trigger_index, subtoken_indexes }) => {
				const next_clause_index = trigger_index + 1
				const next_clause_context_filter = create_context_filter({
					'subtokens': { 'token': '(simple)', 'skip': 'all' },
				})

				if (next_clause_index >= tokens.length || !next_clause_context_filter(tokens, next_clause_index).success) {
					const complex_token = tokens[trigger_index].sub_tokens[subtoken_indexes[0]]
					return {
						token_to_flag: complex_token,
						warning: 'A simple vocabulary alternate typically directly follows a complex alternate, but no simple alternate was found.',
					}
				}
			}),
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

	// TODO #101 use 'error' instead of require, and change 'precededby/followedby' to insert actions

	/** @type {string} */
	// @ts-ignore there will always be a message tag
	const message_tag = ['require', 'warning', 'suggest', 'info'].find(tag => tag in rule_json)

	/** @type {MessageLabel} */
	// @ts-ignore the string will always be a MessageType
	const message_label = message_tag === 'require' ? 'error' : message_tag
	const message_type = get_message_type(message_label)

	const action = checker_action(rule_json[message_tag], message_type)

	return {
		trigger,
		context,
		action,
	}

	/**
	 * @param {CheckerAction} action 
	 * @param {MessageType} message_type
	 * @returns {RuleAction}
	 */
	function checker_action(action, message_type) {
		return trigger_context => {
			const { tokens, trigger_index } = trigger_context

			const formatted_message = format_token_message(trigger_context, action.message)
			const message = {
				...message_type,
				message: formatted_message,
			}

			// The action will have a precededby, followedby, or neither. Never both.
			if (action.precededby) {
				tokens.splice(trigger_index, 0, create_added_token(action.precededby, message))
				return trigger_index + 2
			}
			if (action.followedby) {
				tokens.splice(trigger_index + 1, 0, create_added_token(action.followedby, message))
				return trigger_index + 2
			}

			const token_to_flag = get_token_to_flag(action, trigger_context)
			set_message_plain(token_to_flag, message)
			return trigger_index + 1
		}
	}

	/**
	 * 
	 * @param {CheckerAction} action 
	 * @param {RuleTriggerContext} trigger_context 
	 */
	function get_token_to_flag(action, { tokens, trigger_token, context_indexes, subtoken_indexes }) {
		if (!action.on) {
			return trigger_token
		}
		const [name, index] = action.on.split(':')
		return name === 'context' ? tokens[context_indexes[parseInt(index)]] :
			name === 'subtokens' ? trigger_token.sub_tokens[subtoken_indexes[parseInt(index)]] :
				trigger_token
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
			&& (token.specified_sense && level_check(token.lookup_results[0].concept)
				|| token.lookup_results.every(result => level_check(result.concept)))
	}
}
/**
 * 
 * @param {(result: OntologyResult?) => boolean} level_check 
 * @returns {TokenFilter}
 */
function check_ambiguous_level(level_check) {
	return token => {
		return token.specified_sense.length === 0
			&& token.lookup_results.length > 0
			&& level_check(token.lookup_results[0].concept)
			&& token.lookup_results.filter(result => result.concept).some(result => !level_check(result.concept))
	}
}

/**
 * 
 * @param {Token} token 
 */
function* check_lookup_results(token) {
	if (token.lookup_results.some(result => result.concept !== null && result.concept.id !== '0')) {
		return {}
	}

	if (token.lookup_results.at(0)?.concept?.id === '0') {
		yield { token_to_flag: token, info: 'The {category} \'{stem}\' is not yet in the Ontology, but should be soon. Consult the How-To document for more info.' }

	} else if (token.lookup_results.some(result => result.how_to.length > 0)) {
		yield { token_to_flag: token, error: 'The {category} \'{stem}\' is not in the Ontology. Hover over the word for hints from the How-To document.' }
		
	} else if (token.lookup_results.length > 0) {
		// a dummy result for an unknown word
		yield { token_to_flag: token, warning: 'The {category} \'{token}\' is not in the Ontology, or its form is not recognized. Consult the How-To document or consider using a different word.' }
	} else {
		yield { token_to_flag: token, warning: '\'{token}\' is not in the Ontology, or its form is not recognized. Consult the How-To document or consider using a different word.' }
		yield { token_to_flag: token, warning: 'WARNING: Because this word is not recognized, errors and warnings within the same clause may not be accurate.' }
		yield { token_to_flag: token, suggest: "Add '_noun', '_verb', '_adj', '_adv', '_adp', or '_conj' after the unknown word if you want the editor to check the syntax more accurately." }
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
