
export const implicit_feature_flags: FlagExtractionRule[] = [
	{
		flag: 'Explanation of Name',
		rules: [{
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
		}],
	},
	{
		flag: 'Metonymy',
		rules: [{
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
		}],
	},
	{
		flag: 'Optional Agent of Passive',
		rules: [{
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
		}],
	},
]