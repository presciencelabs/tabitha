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

const triggerFilters: TriggerFilter[] = [
	{
		name: 'literal/dynamic alternates',
		condition: feature_value('Clause', 'Alternative Analysis', 'Literal Alternate'),
		prompt: `For each clause marked as 'Literal Alternate', describe how it can be understood as its 'Dynamic Alternate' equivalent by comparing and quoting ONLY the parts of the sentence that are different.
'Literal' here refers to how closely the wording matches to the original Biblical text, not that it is not metaphorical. And 'Dynamic' refers to a more meaning-based wording.
Do not ask the MTT to keep them separate or to choose one of them. Instead, simply compare the parts that are different so they can see the full meaning.
Remember that the MTT does not have the TBTA semantic analysis data, so if you refer to it, you need to make clear what you are referring to.`,
	},
	{
		name: 'primary and other alternates',
		condition: feature_value('Clause', 'Alternative Analysis', 'Primary Analysis'),
		prompt: `For each Clause with 'Primary Analysis', also show its 'Alternative Analysis' options, comparing and quoting the parts that are different.
The 'Primary Analysis' is the most common interpretation of the original Biblical text, and the other analysis are alternative interpretations.
Do not ask the MTT to keep them separate or to choose one of them. Instead, simply compare the parts that are different so they can see all the possibilities.
Remember that the MTT does not have the TBTA semantic analysis data, so if you refer to it, you need to make clear what you are referring to.`,
	},
	{
		name: 'dynamic expansion',
		condition: feature_value('Noun Phrase', 'Implicit', 'Dynamic Expansion (Metonymy)'),
		prompt: `For any Noun Phrase with 'Dynamic Expansion', explain that the the first noun X can be represented as Y of X where Y is the second noun.`,
	},
	{
		name: 'literal expansion',
		condition: feature_value('Noun Phrase', 'Implicit', 'Literal Expansion (Metonymy)'),
		prompt: `For any Noun Phrase with 'Literal Expansion', explain that the the phrase X of Y can be understood as simply Y.`,
	},
	{
		name: 'rhetorical questions (present in language)',
		lang_condition: (profile) => profile.rhetorical_questions,
		condition: feature_present('Clause', 'Rhetorical Question'),
		prompt: `Explain what kind of rhetorical question it is and what the expected answer is, based on the value of the Rhetorical Question feature.
Tell the MTT to think about how to phrase it to communicate that meaning.`,
	},
	{
		name: 'rhetorical questions (absent in language)',
		lang_condition: (profile) => !profile.rhetorical_questions,
		condition: feature_present('Clause', 'Rhetorical Question'),
		prompt: `Explain that this verse contains rhetorical questions, and show the MTT the 'Equivalent Statement'.`,
	},
	{
		name: 'exclusive "we"',
		lang_condition: (profile) => profile.clusivity,
		condition: feature_value('Noun', 'Person', 'First Exclusive'),
		prompt: `Explain that this verse contains exclusive 'we', so tell the MTT to be extra mindful of who the speaker/writer is referring to.`,
	},
	{
		name: 'passive',
		lang_condition: (profile) => !profile.passive,
		condition: feature_value('Clause', 'Topic Noun Phrase', 'Most Patient-like'),
		prompt: `For each Clause with the 'Topic Noun Phrase' set to 'Most Patient-like', explain to the MTT that in that sentence they should emphasize [the 'Most Patient-like' Noun] and deemphasize [the 'Most Agent-like' Noun].
If the Noun Phrase marked with 'Most Agent-like' has 'Implicit' == 'Optional Agent of Passive', then your suggestion should first explain that the actor/agent is understood to be [the 'Most Agent-like' noun].`,
	},
	{
		name: 'dual',
		lang_condition: (profile) => profile.dual,
		condition: feature_value('Noun', 'Number', 'Dual'),
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
		condition: features_present('Clause', ['Speaker', 'Listener', "Speaker's Age", 'Speaker-Listener Age']),
		prompt: `Show the MTT the social relation between the speaker and listener based on these features in the TBTA semantic analysis: Speaker, Listener, Speaker's Age, Speaker-Listener Age.
Tell the MTT to be mindful of this social relation in how they express what is being said.`,
	},
	{
		name: 'explanation of name',
		condition: feature_value('Noun Phrase', 'Implicit', 'Explanation of Name'),
		prompt: `For any Implicit 'Explanation of Name', note that the first noun (usually a proper noun) is the name of a second noun (usually something like city or region).`,
	},
	{
		name: 'complex alternates',
		condition: feature_present('Clause', 'Vocabulary Alternate'),
		prompt: `For each 'complex vocabulary alternate', describe how it can be understood as its simple equivalent by comparing the parts of the sentence that are different.
Do not merge or harmonize the alternates, and do not ask the MTT to keep them separate.
Remember that the MTT does not have the TBTA semantic analysis data, so if you refer to it, you need to make clear what you are referring to.`,
	},
	{
		name: 'pairings',
		condition: node => 'pairing_concept' in node,
		prompt: `For all unique pairings, explain that the second pairing_concept can also be understood as its corresponding simpler concept.`,
	},
	{
		name: 'implicit information',
		condition: feature_values('Clause', 'Implicit Information', ['Implicit Situational', 'Implicit Background Information', 'Implicit Historical Information']),
		prompt: `For any clause with the feature 'implicit situtational/background/historical information', note that that information is not in the original source but may be helpful to understand the surrounding context.`,
	},
	{
		name: 'indirect speech',
		condition: node => node.concept === 'say-C',
		prompt: `Explain that this verse usually uses indirect speech, so tell the MTT to think about how to word it as direct speech.`,
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

export function find_triggered_issues(encoding: EncodingEntity[], languageProfile: LanguageProfile): TriggerFilter[] {
	const filtered_by_encoding = triggerFilters.filter(trigger => find_node_in_encoding(encoding, trigger.condition))
	const filtered_by_language_profile = filtered_by_encoding.filter(trigger => !trigger.lang_condition || trigger.lang_condition(languageProfile))
	return filtered_by_language_profile
}