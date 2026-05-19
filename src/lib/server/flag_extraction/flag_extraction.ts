
import { match_pattern } from './tree_pattern_match'


const extraction_rules: FlagExtractionRule[] = [
	{
		flag: 'Verb Time',
		value: '$time',
		pattern: {
			name: '$anchor',
			category: 'Verb',
			concept: '$concept',
			features: {
				'Time': '$time',
			},
		},
	},
	{
		flag: 'Verb Aspect',
		value: '$aspect',
		pattern: {
			name: '$anchor',
			category: 'Verb',
			concept: '$concept',
			features: {
				'Aspect': '$aspect',
			},
		},
	},
	{
		flag: 'Verb Mood',
		value: '$mood',
		pattern: {
			name: '$anchor',
			category: 'Verb',
			concept: '$concept',
			features: {
				'Mood': '$mood',
			},
		},
	},
	{
		flag: 'Verb Polarity',
		value: '$polarity',
		pattern: {
			name: '$anchor',
			category: 'Verb',
			concept: '$concept',
			features: {
				'Polarity': '$polarity',
			},
		},
	},
	{
		flag: 'Noun Number',
		value: '$number',
		pattern: {
			name: '$anchor',
			category: 'Noun',
			concept: '$concept',
			features: {
				'Number': '$number',
				'Noun List Index': '$noun_index',
			},
		},
	},
	{
		flag: 'Noun Person',
		value: '$person',
		pattern: {
			name: '$anchor',
			category: 'Noun',
			concept: '$concept',
			features: {
				'Person': '$person',
				'Noun List Index': '$noun_index',
			},
		},
	},
	{
		flag: 'Modifier Degree',
		value: '$degree',
		pattern: {
			name: '$anchor',
			category: 'Adjective|Adverb',
			concept: '$concept',
			features: {
				'Degree': '$degree',
			},
		},
	},
	{
		flag: 'Speaker',
		value: '$speaker',
		pattern: {
			name: '$anchor',
			category: 'Clause',
			features: {
				'Speaker': '$speaker',
			},
		},
	},
	{
		flag: 'Listener',
		value: '$listener',
		pattern: {
			name: '$anchor',
			category: 'Clause',
			features: {
				'Listener': '$listener',
			},
		},
	},
	{
		flag: 'Speaker Attitude',
		value: '$attitude',
		pattern: {
			name: '$anchor',
			category: 'Clause',
			features: {
				'Speaker`s Attitude': '$attitude',
			},
		},
	},
	{
		flag: 'Explanation of Name',
		value: '$label named $proper_name',
		pattern: {
			category: 'Noun Phrase',
			children: [
				{
					category: 'Noun',
					concept: '$proper_name',
				},
				{
					name: '$anchor',
					category: 'Noun Phrase',
					features: {
						'Implicit': 'Explanation of Name',
					},
					children: [
						{
							category: 'Noun',
							concept: '$label',
						},
					],
				},
			],
		},
	},
	{
		flag: 'Metonymy',
		value: '$part of $whole',
		pattern: {
			category: 'Noun Phrase',
			children: [
				{
					category: 'Noun',
					concept: '$whole',
				},
				{
					name: '$anchor',
					category: 'Noun Phrase',
					features: {
						'Implicit': 'Dynamic Expansion (Metonymy)|Literal Expansion (Metonymy)',
					},
					children: [
						{
							category: 'Noun',
							concept: '$part',
						},
					],
				},
			],
		},
		anchor_extra: match => ({ metonymy_type: match.captures['$anchor'].node.features?.['Implicit'] ?? '' }),
	},
	{
		flag: 'Intent/Result',
		value: 'Intent',
		pattern: {
			category: 'Clause',
			children: [
				{
					category: 'Verb Phrase',
					children: [
						{
							category: 'Verb',
							concept: '$event',
						},
					],
				},
				{
					category: 'Clause',
					children: [
						{
							name: '$anchor',
							category: 'Adposition',
							concept: 'so-A|so-C|in-order-to-A',
						},
						{
							category: 'Verb Phrase',
							children: [
								{
									category: 'Verb',
									concept: '$result',
								},
							],
						},
					],
				},
			],
		},
	},
	{
		flag: 'Intent/Result',
		value: 'Logical Consequence',
		pattern: {
			category: 'Clause',
			children: [
				{
					name: '$anchor',
					category: 'Conjunction',
					concept: 'therefore-A|then-B',
				},
				{
					category: 'Verb Phrase',
					children: [
						{
							category: 'Verb',
							concept: '$result',
						},
					],
				},
			],
		},
	},
	{
		flag: 'Intent/Result',
		value: 'Simple Result',
		pattern: {
			category: 'Clause',
			children: [
				{
					name: '$anchor',
					category: 'Conjunction',
					concept: 'so-A|then-D',
				},
				{
					category: 'Verb Phrase',
					children: [
						{
							category: 'Verb',
							concept: '$result',
						},
					],
				},
			],
		},
	},
	{
		flag: 'Intent/Result',
		value: 'Simple Result',
		pattern: {
			category: 'Clause',
			children: [
				{
					category: 'Verb Phrase',
					children: [
						{
							category: 'Verb',
							concept: '$event',
						},
					],
				},
				{
					category: 'Clause',
					children: [
						{
							name: '$anchor',
							category: 'Adposition',
							concept: 'so-B',
						},
						{
							category: 'Verb Phrase',
							children: [
								{
									category: 'Verb',
									concept: '$result',
								},
							],
						},
					],
				},
			],
		},
	},
	{
		flag: 'Metaphor',
		value: 'Metaphor',
		pattern: {
			name: '$anchor',
			category: 'Clause',
			features: {
				'Type': 'Independent',
			},
			children: [
				{
					category: 'Noun Phrase',
					features: {
						'Semantic Role': 'Most Agent-like',
					},
					children: [{
						category: 'Noun',
						concept: '$subject',
					}],
				},
				{
					category: 'Verb Phrase',
					children: [{
						category: 'Verb',
						concept: 'be-X|be-U',
					}],
				},
				{
					category: 'Noun Phrase',
					features: {
						'Semantic Role': 'State',
					},
					children: [{
						category: 'Noun',
						concept: '$state',
					}],
				},
			],
		},
	},
	{
		flag: 'Optional Agent of Passive',
		value: '$agent',
		pattern: {
			category: 'Clause',
			features: {
				'Topic NP': 'Most Patient-like',
			},
			children: [
				{
					name: '$anchor',
					category: 'Noun Phrase',
					features: {
						'Semantic Role': 'Most Agent-like',
						'Implicit': 'Optional Agent of Passive',
					},
					children: [{
						category: 'Noun',
						concept: '$agent',
					}],
				},
				{
					category: 'Verb Phrase',
					children: [{
						category: 'Verb',
						concept: '$verb',
					}],
				},
			],
		},
	},
	{
		flag: 'Means/Reason',
		value: match => match.captures['$anchor'].node.concept === 'because-B' ? 'Reason' : 'Means',
		pattern: {
			category: 'Clause',
			children: [
				{
					category: 'Verb Phrase',
					children: [{
						category: 'Verb',
						concept: '$event',
					}],
				},
				{
					category: 'Noun Phrase',
					children: [
						{
							name: '$anchor',
							category: 'Adposition',
							concept: 'through-B|because-B',
						},
						{
							category: 'Noun',
							concept: '$means_or_reason',
						},
					],
				},
			],
		},
	},
	{
		flag: 'Means/Reason',
		value: match => match.captures['$anchor'].node.concept === 'because-A' ? 'Reason' : 'Means',
		pattern: {
			category: 'Clause',
			children: [
				{
					category: 'Verb Phrase',
					children: [
						{
							category: 'Verb',
							concept: '$event',
						},
					],
				},
				{
					category: 'Clause',
					children: [
						{
							name: '$anchor',
							category: 'Adposition',
							concept: 'because-A|by-A',
						},
						{
							category: 'Verb Phrase',
							children: [
								{
									category: 'Verb',
									concept: '$means_or_reason',
								},
							],
						},
					],
				},
			],
		},
	},
]

/*
 * Obligation Degree

 */

export function extract_flags(entities: EncodingEntity[]): CopilotTriggerFlag[] {
	let root_node: EncodingEntity = {
		category: 'Root',
		children: entities,
	}

	const flags: CopilotTriggerFlag[] = []

	for (const rule of extraction_rules) {
		const matches = match_pattern(rule.pattern, root_node)
		flags.push(...matches.map(flag_from_match(rule)))
	}

	return flags
}

function extract_value(rule: FlagExtractionRule, match: EntityMatch): string {
	if (typeof rule.value === 'string') {
		return rule.value.replaceAll(/\$\w+/g, m => match.bindings[m])
	} else {
		return rule.value(match)
	}
}

function flag_from_match(rule: FlagExtractionRule): (match: EntityMatch) => CopilotTriggerFlag {
	return match => {
		const anchor_name = '$anchor' in match.captures ? '$anchor' : Object.keys(match.captures)[0]
		const anchor_node = match.captures[anchor_name]
		const node_id = anchor_node?.indexStack.join('.') ?? ''
		const node_category = anchor_node?.node.category ?? ''
		const anchor_entries = Object.entries(match.bindings).map(([key, value]) => ([key.replace('$', ''), String(value)]))

		return {
			name: rule.flag,
			value: extract_value(rule, match),
			encoding_anchor: {
				node_id,
				category: node_category,
				...Object.fromEntries(anchor_entries),
				...rule.anchor_extra?.(match),
			}
		}
	}
}