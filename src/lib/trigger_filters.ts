type EntityFilter = (node: EncodingEntity) => boolean
type LanguageProfileFilter = (profile: LanguageProfile) => boolean

interface TriggerFilter {
	name: string
	condition: EntityFilter
	lang_condition?: LanguageProfileFilter
	prompt: string
}

function feature_value(category: string, feature_name: string, feature_value: any): EntityFilter {
	return node => node.category === category && node.features?.[feature_name] === feature_value
}

function feature_values(category: string, feature_name: string, feature_values: any[]): EntityFilter {
	return node => {
		const node_value = node.features?.[feature_name]
		return node.category === category && feature_values.some(value => node_value === value)
	}
}

function feature_present(category: string, feature_name: string): EntityFilter {
	return node => node.category === category && node.features !== undefined && feature_name in node.features;
}

function features_present(category: string, featureNames: string[]): EntityFilter {
	return node => node.category === category && node.features !== undefined && featureNames.some(name => name in (node.features ?? {}));
}

export const trigger_filters: TriggerFilter[] = [
	{
		name: 'literal/dynamic alternates',
		condition: feature_value('Clause', 'Alternative Analysis', 'Literal Alternate'),
		prompt: `For each clause marked as 'Literal Alternate', state minimally how it can be understood as its 'Dynamic Alternate' equivalent by comparing and quoting ONLY the parts of the sentence that are different.
'Literal' here refers to how closely the wording matches to the original Biblical text, not that it is not metaphorical. And 'Dynamic' refers to a more meaning-based wording.
Simply compare the parts that are different so they can see the full meaning.`,
	},
	{
		name: 'primary and other alternates',
		condition: feature_value('Clause', 'Alternative Analysis', 'Primary Analysis'),
		prompt: `For each Clause with 'Primary Analysis', also show its 'Alternative Analysis' options, comparing and quoting the parts that are different.
The 'Primary Analysis' is the most common interpretation of the original Biblical text, and the other analyses are alternative interpretations.
Simply compare the parts that are different so they can see all the possibilities.`,
	},
	{
		name: 'complex alternates',
		condition: feature_present('Clause', 'Vocabulary Alternate'),
		prompt: `For each clause marked as 'Complex Vocabulary Alternate', explain that it can be understood as its corresponding 'Simple Vocabulary Alternate(s)' by quoting and comparing the parts of the sentences that are different.
		You should always quote and compare them, even if you think they are too different in meaning.
		If the simple alterate is not in the english_text, convert the encoding to natural English to quote it.`,
	},
	{
		name: 'rhetorical questions (present in language)',
		lang_condition: (profile) => profile.rhetorical_questions,
		condition: feature_present('Clause', 'Rhetorical Question'),
		prompt: `Explain what kind of rhetorical question is present and what the expected answer is, based on the value of the Rhetorical Question feature.
State that they need to think about how to phrase it to communicate that meaning.`,
	},
	{
		name: 'rhetorical questions (absent in language)',
		lang_condition: (profile) => !profile.rhetorical_questions,
		condition: feature_present('Clause', 'Rhetorical Question'),
		prompt: `State that this verse contains rhetorical questions, and show each 'Equivalent Statement'.`,
	},
	{
		name: 'passive implicit agent',
		lang_condition: (profile) => !profile.passive,
		condition: feature_value('Noun Phrase', 'Implicit', 'Optional Agent of Passive'),
		prompt: `For each unique Noun Phrase marked as 'Optional Agent of Passive', state minimally that that noun is understood to be the actor/agent in its surrounding clause(s).`,
	},
	{
		name: 'passive',
		lang_condition: (profile) => !profile.passive,
		condition: feature_value('Clause', 'Topic NP', 'Most Patient-like'),
		prompt: `For each Clause with the 'Topic Noun Phrase' set to 'Most Patient-like', state minimally that in that sentence they should emphasize [the 'Most Patient-like' Noun] and deemphasize [the 'Most Agent-like' Noun].`,
	},
	{
		name: 'dynamic expansion',
		condition: feature_value('Noun Phrase', 'Implicit', 'Dynamic Expansion (Metonymy)'),
		prompt: `For any Noun Phrase with 'Dynamic Expansion', state minimally that the the first noun X can be represented as Y of X, where Y is the second noun.`,
	},
	{
		name: 'literal expansion',
		condition: feature_value('Noun Phrase', 'Implicit', 'Literal Expansion (Metonymy)'),
		prompt: `For any Noun Phrase with 'Literal Expansion', state minimally that the the phrase X of Y can be understood as simply Y.`,
	},
	{
		name: 'exclusive "we"',
		lang_condition: (profile) => profile.clusivity,
		condition: feature_value('Noun', 'Person', 'First Exclusive'),
		prompt: `State that this verse contains exclusive 'we', so tell the MTT to be extra mindful of who the speaker/writer is referring to.`,
	},
	{
		name: 'dual',
		lang_condition: (profile) => profile.dual,
		condition: node => feature_value('Noun', 'Number', 'Dual')(node) && feature_value('Noun', 'Person', 'Third')(node),
		prompt: `Show the MTT which Nouns are marked as Dual so they can decide which form to use. If the Noun is already modified by the number '2', DO NOT show it to the MTT.`,
	},
	{
		name: 'trial',
		lang_condition: (profile) => profile.trial,
		condition: feature_value('Noun', 'Number', 'Trial'),
		prompt: `Show the MTT which Nouns are marked as Trial so they can decide which form to use. If the Noun is already modified by the number '3', DO NOT show it to the MTT.`,
	},
	{
		name: 'honorifics',
		lang_condition: (profile) => profile.honorifics,
		condition: features_present('Clause', ['Speaker', 'Listener', "Speaker`s Age", 'Speaker-Listener Age']),
		prompt: `Show the MTT the social relation between the speaker and listener based on these features in the TBTA semantic analysis: Speaker, Listener, Speaker's Age, Speaker-Listener Age.
Tell the MTT to be mindful of this social relation in how they express what is being said.`,
	},
	{
		name: 'speaker attitude',
		condition: feature_values('Clause', "Speaker`s Attitude", ['Endearing', 'Polite', 'Honorable', 'Complimentary', 'Derogatory', 'Antagonistic-Hostile', 'Anger', 'Rebuke', 'Imploring']),
		prompt: `Show the MTT the Speaker's Attitude if it is not neutral. Tell the MTT to be mindful of this attitude in how they express what is being said.`,
	},
	{
		name: 'explanation of name',
		condition: feature_value('Noun Phrase', 'Implicit', 'Explanation of Name'),
		prompt: `For any Implicit 'Explanation of Name', state minimally that the first noun (usually a proper noun) is the name of a second noun (usually something like city or region).
		That second noun is not in the source text, so this is helpful extra information for the MTT.`,
	},
	{
		name: 'pairings',
		condition: node => 'pairing_concept' in node,
		prompt: `For all unique pairings, state minimally that if they don't have a good equivalent for the second pairing_concept, it can also be understood as its corresponding simpler concept.
		If the two concepts are really close in meaning, don't bother making a caution for them.`,
	},
	{
		name: 'closing quotation frame',
		lang_condition: (profile) => profile.closing_quotation_frame,
		condition: feature_value('Clause', 'Type', 'Closing Quotation Frame'),
		prompt: `For each 'Closing Quotation Frame' if the quote does not also begin in this verse, remind the the MTT of who said what to who by converting the closing quotation frame to natural English.`,
	},
	// {
	// 	name: 'implicit information',
	// 	condition: feature_values('Clause', 'Implicit Information', ['Implicit Situational Information', 'Implicit Background Information', 'Implicit Historical Information']),
	// 	prompt: `Explain the surrounding context of any clause with the feature 'implicit situtational/background/historical information', in light of but without directly quoting that implicit information.
	// 	DO NOT directly quote the implicit clause, but include its meaning within the explanation of the surrounding context.`,
	// },
	{
		name: 'indirect speech',
		lang_condition: profile => !profile.indirect_speech,
		condition: node => node.concept === 'say-C',
		prompt: `Convert the patient clause(s) of say-C to a direct quote and offer that as a possibility of how to reword it.`,
	},
];

function find_node_in_encoding(encoding: EncodingEntity[], entity_filter: EntityFilter): boolean {
	for (const node of encoding) {
		if (entity_filter(node) || (node.children && find_node_in_encoding(node.children, entity_filter))) {
			return true
		}
	}
	return false
}

export function filter_by_encoding(encoding: EncodingEntity[]): (trigger: TriggerFilter) => boolean {
	return trigger => find_node_in_encoding(encoding, trigger.condition)
}

export function filter_by_language_profile(language_profile: LanguageProfile): (trigger: TriggerFilter) => boolean {
	return trigger => !trigger.lang_condition || trigger.lang_condition(language_profile)
}