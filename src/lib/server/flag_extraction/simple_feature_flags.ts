
export const simple_feature_flags: FlagExtractionRule[] = [
	{
		flag: 'Verb Time',
		rules: [{
			value: '$time',
			pattern: {
				name: '$anchor',
				category: 'Verb',
				concept: '$concept',
				features: {
					'Time': '$time',
				},
			},
		}],
	},
	{
		flag: 'Verb Aspect',
		rules: [{
			value: '$aspect',
			pattern: {
				name: '$anchor',
				category: 'Verb',
				concept: '$concept',
				features: {
					'Aspect': '$aspect',
				},
			},
		}],
	},
	{
		flag: 'Verb Mood',
		rules: [{
			value: '$mood',
			pattern: {
				name: '$anchor',
				category: 'Verb',
				concept: '$concept',
				features: {
					'Mood': '$mood',
				},
			},
		}],
	},
	{
		flag: 'Verb Polarity',
		rules: [{
			value: '$polarity',
			pattern: {
				name: '$anchor',
				category: 'Verb',
				concept: '$concept',
				features: {
					'Polarity': '$polarity',
				},
			},
		}],
	},
	{
		flag: 'Noun Number',
		rules: [{
			comment: 'If the noun is already modified by a number, do not flag it as Dual/Trial/Quadrial',
			value: undefined,
			pattern: {
				category: 'Noun Phrase',
				children: [
					{
						name: '$anchor',
						category: 'Noun',
						concept: '$concept',
						features: {
							'Number': '$number',
							'Noun List Index': '$noun_index',
						},
					},
					{
						category: 'Adjective Phrase',
						children: [{
							category: 'Adjective',
							concept: '2-A|3-A|4-A',
						}],
					},
				],
			},
		},
		{
			value: '$number',
			comment: 'Keep the NP so that it triggers on the same node as the first rule',
			pattern: {
				category: 'Noun Phrase',
				children: [{
					name: '$anchor',
					category: 'Noun',
					concept: '$concept',
					features: {
						'Number': '$number',
						'Noun List Index': '$noun_index',
					},
				}],
			},
		}],
	},
	{
		flag: 'Noun Person',
		rules: [{
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
		}],
	},
	{
		flag: 'Modifier Degree',
		rules: [{
			value: '$degree',
			pattern: {
				name: '$anchor',
				category: 'Adjective|Adverb',
				concept: '$concept',
				features: {
					'Degree': '$degree',
				},
			},
		}],
	},
	{
		flag: 'Speaker',
		rules: [{
			value: '$speaker',
			pattern: {
				name: '$anchor',
				category: 'Clause',
				features: {
					'Speaker': '$speaker',
				},
			},
		}],
	},
	{
		flag: 'Listener',
		rules: [{
			value: '$listener',
			pattern: {
				name: '$anchor',
				category: 'Clause',
				features: {
					'Listener': '$listener',
				},
			},
		}],
	},
	{
		flag: 'Speaker Attitude',
		rules: [{
			value: '$attitude',
			pattern: {
				name: '$anchor',
				category: 'Clause',
				features: {
					'Speaker`s Attitude': '$attitude',
				},
			},
		}],
	},
]