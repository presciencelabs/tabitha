// Verb categorizations in the database '[Aa_][Bb_][Cc_][Dd_][Ee_][Ff_][Gg_][Hh_][Ii_]'
// DisplayOntologyDlg.cppL1010
//
// The letters are irrelevant, the position and case are what matters:
//		| position 	| meaning 						|
//		| -------- 	| -------------------------|
//		| 0 (Aa)		| Agent-like 					|
//		| 1 (Bb)		| Patient-like 				|
//		| 2 (Cc)		| State 							|
//		| 3 (Dd)		| Source 						|
//		| 4 (Ee)		| Destination 					|
//		| 5 (Ff)		| Instrument 					|
//		| 6 (Gg)		| Beneficiary 					|
//		| 7 (Hh)		| Patient proposition 		|
//		| 8 (Ii)		| Participant proposition	|
//
// Uppercase means required, lowercase means optional and an underscore('_') in any position means not applicable.
const required = {
	A: 'Agent-like',
	B: 'Patient-like',
	C: 'State',
	D: 'Source',
	E: 'Destination',
	F: 'Instrument',
	G: 'Beneficiary',
	H: 'Patient proposition',
	I: 'Participant proposition',
}

const optional = Object.entries(required).reduce(lowercase_and_parens, {})

/**
 * @param {Record<string,string>} optional The new object being created that holds lowercase keys and parenthesized values.
 * @param {[string,string]} current_record
 *
 * @returns {Record<string,string>} - { a: '(Agent-like)', b: '(Patient-like)', ... }
 */
function lowercase_and_parens(optional, [key, value]) {
	optional[key.toLowerCase()] = `(${value})`

	return optional
}

/**
 * @type {Record<string, string>}
 */
export const theta_grid = {
	...required,
	...optional,
	_: '',
}

/**
 * @type {Record<Concept['part_of_speech'], Record<string, string>>}
 */
export const semantic_category = {
	// Adjective categorizations
	// DisplayOntologyDlg.cppL1064
	//
	// [Aa_][Bb_][Cc_][Dd_][Ee_][Ff_]
	//
	// 	| position 	| usage info 																		|
	//		| ---------	| ---------------------------------------------------------------	|
	//		| 2			| used attributively 															|
	//		| 3			| used predicately without an argument 									|
	//		| 4			| used predicately with a nominal argument 								|
	//		| 5			| used predicately with a same participant clausal argument 		|
	//		| 6			| used predicately with a different participant clausal argument 	|
	//		| 7			| used comparatively 															|
	//
	//		| case		| when		|
	//		| ---------	| ---------	|
	//		| upper		| always		|
	//		| lower		| sometimes	|
	//		| _			| never		|
	Adjective: {
		G: 'Generic',
		C: 'Cardinal number',
		O: 'Ordinal number',
		F: 'Fractional number',
		Q: 'Quantity',
		I: 'Identity',
		L: 'Color',
	},
	// Noun categorizations
	// TBTA -> (ontology) -> (nouns) -> Concept Subsets button
	// SemanticDomainNamesDlg.cpp::LoadConceptCategories (comment on line ~504)
	// Ontology.mdb:Features_Source.FeatureValues
	//
	// | letter | meaning 				|
	// | ------ | ------------------ |
	// | A 		| Abstracts 			|
	// | F 		| Feminine names 		|
	// | G 		| Geographical names |
	// | M 		| Masculine names 	|
	// | O 		| Ordinal numbers 	|
	// | T 		| Temporal names 		|
	// | g 		| Other proper names |
	// | o 		| All other objects 	|
	Noun: {
		A: 'Abstracts',
		F: 'Feminine names',
		G: 'Geographical names',
		M: 'Masculine names',
		O: 'Ordinal numbers',
		T: 'Temporal names',
		g: 'Other proper names',
		o: 'All other objects',
	},
}

/**
 * @type {Record<Concept['part_of_speech'], string[]>}
 */
// prettier-ignore
export const usage_info = {
	Adjective: [
		'used attributively',
		'used predicatively without an argument',
		'used predicatively with a nominal argument',
		'used predicatively with a same participant clausal argument',
		'used predicatively with a different participant clausal argument',
		'used comparatively',
	],
	Adposition: [
		'used in Adjunct Phrases',
		'used in Noun-Noun Phrases',
		'used in Abverbial Clauses',
	],
	Adverb: [
		'used in Clauses to modify Verbs',
		'used in Noun Phrases',
		'used in Adjective Phrases',
	],
	Conjunction: [
		'used to conjoin Clauses',
		'used to conjoin Noun Phrases',
		'used to conjoin Adjective Phrases',
		'used to conjoin Adverb Phrases',
	],
}

/**
 * Represents a collection of books.
 * @typedef {Record<number, string>} Book
 * @property {number} number - The unique number representing a book.
 * @property {string} name - The name of the book.
 */

/**
 * @type {Book} – book number, book name
 *
 * ReferenceUtils.cpp CReferenceUtils::GetBookNumber
 */
const bible_books = {
	1: 'Genesis',
	2: 'Exodus',
	3: 'Leviticus',
	4: 'Numbers',
	5: 'Deuteronomy',
	6: 'Joshua',
	7: 'Judges',
	8: 'Ruth',
	9: '1 Samuel',
	10: '2 Samuel',
	11: '1 Kings',
	12: '2 Kings',
	13: '1 Chronicles',
	14: '2 Chronicles',
	15: 'Ezra',
	16: 'Nehemiah',
	17: 'Esther',
	18: 'Job',
	19: 'Psalms',
	20: 'Proverbs',
	21: 'Ecclesiastes',
	22: 'Song of Solomon',
	23: 'Isaiah',
	24: 'Jeremiah',
	25: 'Lamentations',
	26: 'Ezekiel',
	27: 'Daniel',
	28: 'Hosea',
	29: 'Joel',
	30: 'Amos',
	31: 'Obadiah',
	32: 'Jonah',
	33: 'Micah',
	34: 'Nahum',
	35: 'Habakkuk',
	36: 'Zephaniah',
	37: 'Haggai',
	38: 'Zechariah',
	39: 'Malachi',
	40: 'Matthew',
	41: 'Mark',
	42: 'Luke',
	43: 'John',
	44: 'Acts',
	45: 'Romans',
	46: '1 Corinthians',
	47: '2 Corinthians',
	48: 'Galatians',
	49: 'Ephesians',
	50: 'Philippians',
	51: 'Colossians',
	52: '1 Thessalonians',
	53: '2 Thessalonians',
	54: '1 Timothy',
	55: '2 Timothy',
	56: 'Titus',
	57: 'Philemon',
	58: 'Hebrews',
	59: 'James',
	60: '1 Peter',
	61: '2 Peter',
	62: '1 John',
	63: '2 John',
	64: '3 John',
	65: 'Jude',
	66: 'Revelation',
}

/**
 * @type {Book}
 *
 * ReferenceUtils.cpp CReferenceUtils::GetBookNumber
 */
const grammar_introduction_books = {
	1: 'Nouns',
	2: 'Verbs',
	3: 'Adjectives',
	4: 'Adverbs',
	5: 'Adpositions',
	6: 'Pronouns',
	7: 'Noun_Phrases',
	8: 'Clauses',
	9: 'Discourse',
	10: 'Theta_Grids',
}

/**
 * @type {Book}
 *
 * ReferenceUtils.cpp CReferenceUtils::GetBookNumber
 */
const community_development_text_books = {
	1: 'Infected Eye',
	2: "Kande's Story",
	3: 'Avian Influenza',
}

/**
 * map lookup for the source and book of a reference
 *
 * as of Nov 2023, the Ontology data looked like this:
 * | source | count 	|
 * |--------|--------|
 * |	3		|	6		| "Missions Documents"
 * |	4		|	1087	| "Bible"
 * |	6		|	57		| "Grammar Introduction"
 * |	7		|	75		| "Community Development Texts"
 *
 * ReferenceUtils.cpp CReferenceUtils::GetSourceTextName
 *
 * @type {Map<string, Book>}
 */
export const sources = new Map([
	['Hebrew Old Testament', {}],
	['Greek New Testament', {}],
	['Greek Grammar Introduction', {}],
	['Missions Documents', {}],
	['Bible', bible_books],
	['Video Subtitles', {}],
	['Grammar Introduction', grammar_introduction_books],
	['Community Development Texts', community_development_text_books],
])
