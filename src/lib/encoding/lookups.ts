
export const CATEGORY_NAME_LOOKUP = new Map([
	['N', 'Noun'],
	['V', 'Verb'],
	['A', 'Adjective'],
	['a', 'Adverb'],
	['P', 'Adposition'],
	['C', 'Conjunction'],
	['p', 'Phrasal'],
	['r', 'Particle'],
	['n', 'Noun Phrase'],
	['v', 'Verb Phrase'],
	['j', 'Adjective Phrase'],
	['d', 'Adverb Phrase'],
	['c', 'Clause'],
	['R', 'Paragraph'],
	['E', 'Section'],
	['.', 'period'],
])

export const CATEGORY_ABBREVIATIONS = new Map([
	['Noun', 'N'],
	['Verb', 'V'],
	['Adjective', 'Adj'],
	['Adverb', 'Adv'],
	['Adposition', 'Adp'],
	['Conjunction', 'Con'],
	['Phrasal', 'Phr'],
	['Particle', 'Par'],
	['Noun Phrase', 'NP'],
	['Verb Phrase', 'VP'],
	['Adjective Phrase', 'AdjP'],
	['Adverb Phrase', 'AdvP'],
	['Clause', 'C'],
	['Paragraph', 'R'],
	['Section', 'E'],
	['period', 'period'],
])

export const WORD_ENTITY_CATEGORIES = new Set(['Noun', 'Verb', 'Adjective', 'Adverb', 'Adposition', 'Conjunction', 'Phrasal', 'Particle'])