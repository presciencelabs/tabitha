import {readdir} from 'node:fs/promises'

/**
 * @param {string} project
 * @param {import('bun:sqlite').Database} targets_db
 * @returns {Promise<void>}
 */
export async function migrate_lexical_forms(project, targets_db) {
	const word_forms = await get_word_forms()

	await load_data(word_forms, targets_db, project)
}

/**
 * @typedef {{
 * 	sequence_number: string,
 * 	stem: string,
 * 	part_of_speech: string,
 * 	forms: string
 * }} WordFormRecord
 *
 * @returns {Promise<Record<['Adjective'|'Adverb'|'Noun'|'Verb'], WordFormRecord[]>>}
 */
async function get_word_forms() {
	console.log(`Getting word forms from the CSV files...`)

	const filenames = await readdir('inflections/csv')
	const csv_contents_by_file = await Promise.all(filenames.map(filename => Bun.file(`inflections/csv/${filename}`).text()))
	const normalized_data = csv_contents_by_file.map(normalize).flat()

	const groups_init = { Adjective: [], Adverb: [], Noun: [], Verb: [] }

	console.log('done.')

	return normalized_data.reduce(grouper, groups_init)

	function normalize(csv_text) {
		return csv_text.split('\n')
			.filter(line => line !== '')
			.map(transform)

		/**
		 * @param {string} line should follow this pattern: sequence_number,stem,part_of_speech,forms
		 * @returns {WordFormRecord}
		 */
		function transform(line) {
			// note:  some stems are numbers, e.g., "7,1,100,Adjective,|||", so we can't just split(',')
			const [, sequence_number, stem, part_of_speech, forms] = line.match(/^(\d+),(.*),(Adjective|Adverb|Noun|Verb),(.*)$/)

			return { sequence_number, stem, part_of_speech, forms }
		}
	}

	function grouper(tracker, item) {
		const { part_of_speech } = item

		tracker[part_of_speech].push(item)

		return tracker
	}
}

/**
 * There is a delicate association between the a word's place in the Lexicon and the sequence number in the CSV file.
 * When the words in the Lexicon are ordered by their ID, the sequence number from the CSV file represents the "index"
 * of the word in the Lexicon.  Additionally, this is in the context of a single part of speech.
 *
 * @param {Record<['Adjective'|'Adverb'|'Noun'|'Verb'], WordFormRecord[]>} word_forms
 * @param {import('bun:sqlite').Database} targets_db
 * @param {string} project
 * @returns {Promise<void>}
 *
 * @typedef {{
 * 	id: number,
 * 	project: string,
 * 	stem: string,
 * 	part_of_speech: string,
 * 	gloss: string,
 * 	features: string,
 * 	constituents: string,
 * 	forms: string
 * }} LexiconRecord
 */
async function load_data(word_forms, targets_db, project) {
	console.log(`Loading word forms into Lexicon table...`)

	for (const part_of_speech of Object.keys(word_forms)) {
		/** @type {LexiconRecord[]} */
		const lexicon_words = targets_db.query(`
			SELECT *
			FROM Lexicon
			WHERE project = ?
				AND part_of_speech = ?
			ORDER BY id
		`).all(project, part_of_speech)

		for (const from_word_forms of word_forms[part_of_speech]) {
			const from_lexicon = lexicon_words[from_word_forms.sequence_number - 1]

			if (is_match({ from_word_forms, from_lexicon })) {
				await targets_db.query(`
					UPDATE Lexicon
					SET forms = ?
					WHERE project = ?
						AND part_of_speech = ?
						AND id = ?
				`).run(from_word_forms.forms, project, part_of_speech, from_lexicon.id)
			} else {
				console.log(`⚠️ NOT LOADED ⚠️ due to mismatch: ${from_word_forms.stem} (from word forms) vs ${from_lexicon.stem} (from lexicon)`)
			}

			await Bun.write(Bun.stdout, '.')
		}
	}

	console.log('done.')

	/**
	 * @param {{
	 * 	from_word_forms: WordFormRecord,
	 * 	from_lexicon: LexiconRecord
	 * }}
	 * @returns {boolean}
	 */
	function is_match({ from_word_forms, from_lexicon }) {
		// constituent data, when present, follows the format "constituent[hints]"
		const constituent = from_lexicon.constituents.split('[')?.[0]
		const stem_from_lexicon = constituent ? `${from_lexicon.stem} ${constituent}` : from_lexicon.stem

		return from_word_forms.stem === stem_from_lexicon
	}
}
