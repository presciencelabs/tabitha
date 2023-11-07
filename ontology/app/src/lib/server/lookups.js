// Verb categorizations in the database '[Aa_][Bb_][Cc_][Dd_][Ee_][Ff_][Gg_][Hh_][Ii_]'
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
 * position-based lookup for the source of a reference
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
 * @type {string[]}
 */
export const sources = [
	'Hebrew Old Testament',
	'Greek New Testament',
	'Greek Grammar Introduction',
	'Missions Documents',
	'Bible',
	'Video Subtitles',
	'Grammar Introduction',
	'Community Development Texts',
]

/**
 * Books of the Bible
 *
 * @type {Record<number, string>} - { 1: 'Genesis', 2: 'Exodus', ... }
 */
export const books = {
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
