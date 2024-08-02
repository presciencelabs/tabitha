import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals: { db }, params: { project }, url: { searchParams } }) {
	/** @type {string} */
	const word = normalize_wildcards(searchParams.get('word') ?? '')

	const stem_sql = `
		SELECT *
		FROM Lexicon
		WHERE project = ?
			AND stem LIKE ?
	`
	const forms_sql = `
		SELECT *
		FROM Lexicon
		WHERE project = ?
			AND forms LIKE ?
	`

	/** @type {import('@cloudflare/workers-types').D1Result<DbRowLexicon>} */
	const { results: stem_matches } = await db.prepare(stem_sql).bind(project, `${word}`).all()
	/** @type {import('@cloudflare/workers-types').D1Result<DbRowLexicon>} */
	const { results: forms_matches } = await db.prepare(forms_sql).bind(project, `%|${word}|%`).all()

	/** @type {LexicalForm[]} */
	const forms = await transform({ stem_matches, forms_matches })

	return json(forms)

	/**
	 * @param {{
	 * 	stem_matches: DbRowLexicon[],
	 * 	forms_matches: DbRowLexicon[]
	 * }} db_matches
	 */
	async function transform({ stem_matches, forms_matches }) {
		/** @type {LexicalForm[]} */
		let forms = []

		for (const { id, stem: base_stem, part_of_speech, constituents } of stem_matches) {
			const stem = derive_stem({ base_stem, constituents })

			forms.push({ id, stem, part_of_speech, form: 'Stem' })
		}

		for (const { id, stem: base_stem, part_of_speech, constituents, forms: encoded_forms } of forms_matches) {
			const stem = derive_stem({ base_stem, constituents })

			// encoded_forms is a pipe-separated string
			// e.g., 'following' => '|followed|followed|following|follows|'
			const matched_indices = trim_pipes(encoded_forms) 	// 'followed|followed|following|follows'
				.split('|') 												// ['followed', 'followed', 'following', 'follows']
				.map((form, i) => is_match(form) ? i : -1) 		// [-1, -1, 2, -1]
				.filter(i => i > -1) 									// [2]

			for (const i of matched_indices) {
				const position = i + 1
				const name = await get_form_name({ db, project, part_of_speech, position })
				forms.push({ id, stem, part_of_speech, form: name })
			}
		}

		return forms

		/**
		 * @param {{
		* 		base_stem: string,
		* 		constituents: string
		*	}} input
		*/
		function derive_stem({ base_stem, constituents }) {
			if (!constituents) {
				return base_stem
			}

			// this string consists of the part we want and some further info in brackets that is not useful in the context of the lexicon
			// e.g.:
			// 	off[Adposition in VP]
			// 	threshing[First Word of Compound Noun]
			// 	over[Verbal Adposition moved to Direct Object]
			// 	of Ono[Post-Nominal Modifier]
			const constituent = constituents.split('[')[0] ?? ''

			return `${base_stem} ${constituent}`
		}

		/** @param {string} encoded_forms  */
		function trim_pipes(encoded_forms) {
			const PIPE_IN_FRONT_OR_REAR = /^\||\|$/

			return encoded_forms.replace(PIPE_IN_FRONT_OR_REAR, '')
		}

		/** @param {string} form */
		function is_match(form) {
			// need a case-insensitive match, e.g., xword=People, it should match the form=people
			if (form.toLowerCase() === word.toLowerCase()) {
				return true
			}

			if (!word.includes('%')) {
				return false
			}

			const constructed_re = new RegExp(word.replaceAll('%', '.*'))

			return constructed_re.test(form)
		}

		/**
		 * @param {{
		 * 	db: import('@cloudflare/workers-types').D1Database,
		 * 	project: string,
		 * 	part_of_speech: string,
		 * 	position: number
		 * }} input
		 * @returns {Promise<string>}
		 */
		async function get_form_name({ db, project, part_of_speech, position }) {
			const sql = `
				SELECT *
				FROM Form_Names
				WHERE project = ?
					AND part_of_speech = ?
					AND position = ?
			`

			/** @type {import('@cloudflare/workers-types').D1Result<DbRowFormNames>} */
			return await db.prepare(sql).bind(project, part_of_speech, position).first('name') ?? ''
		}
	}

	/**
	 * @param {string} possible_wildard – a string that may contain wildcards, e.g., '*' or '#' or '%'
	 * @returns {string} SQL-ready string, i.e., `%` for wildcards
	 */
	function normalize_wildcards(possible_wildard) {
		return possible_wildard.replace(/[*#]/g, '%')
	}
}
