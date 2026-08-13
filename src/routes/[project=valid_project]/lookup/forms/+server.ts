import { json, type RequestHandler } from '@sveltejs/kit'
import type { D1Database } from '@cloudflare/workers-types'
import type { DbRowLexicon, LexicalForm } from '$lib/types'

export const GET: RequestHandler = async ({ locals: { db }, params: { project }, url: { searchParams } }) => {
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

	const { results: stem_matches } = await db.prepare(stem_sql).bind(project, `${word}`).all<DbRowLexicon>()
	const { results: forms_matches } = await db.prepare(forms_sql).bind(project, `%|${word}|%`).all<DbRowLexicon>()

	const forms: LexicalForm[] = await transform({ stem_matches: stem_matches ?? [], forms_matches: forms_matches ?? [] })

	const TWELVE_HOUR_CACHE = {
		'cache-control': `max-age=${12 * 60 * 60}`,
	}

	return json(forms, {
		headers: TWELVE_HOUR_CACHE,
	})

	async function transform({ stem_matches, forms_matches }: { stem_matches: DbRowLexicon[]; forms_matches: DbRowLexicon[] }): Promise<LexicalForm[]> {
		const forms: LexicalForm[] = []

		for (const { id, stem: base_stem, part_of_speech, constituents } of stem_matches) {
			const stem = derive_stem({ base_stem, constituents })

			forms.push({ id, stem, part_of_speech, form: 'Stem' })
		}

		for (const { id, stem: base_stem, part_of_speech, constituents, forms: encoded_forms } of forms_matches) {
			const stem = derive_stem({ base_stem, constituents })

			const matched_indices = trim_pipes(encoded_forms)
				.split('|')
				.map((form, i) => is_match(form) ? i : -1)
				.filter(i => i > -1)

			for (const i of matched_indices) {
				const position = i + 1
				const name = await get_form_name({ db, project: project!, part_of_speech, position })
				forms.push({ id, stem, part_of_speech, form: name })
			}
		}

		return forms

		function derive_stem({ base_stem, constituents }: { base_stem: string; constituents: string }): string {
			if (!constituents) {
				return base_stem
			}

			const constituent = constituents.split('[')[0] ?? ''

			return `${base_stem} ${constituent}`
		}

		function trim_pipes(encoded_forms: string): string {
			const PIPE_IN_FRONT_OR_REAR = /^\||\|$/

			return encoded_forms.replace(PIPE_IN_FRONT_OR_REAR, '')
		}

		function is_match(form: string): boolean {
			if (form.toLowerCase() === word.toLowerCase()) {
				return true
			}

			if (!word.includes('%')) {
				return false
			}

			const constructed_re = new RegExp(word.replaceAll('%', '.*'))

			return constructed_re.test(form)
		}

		async function get_form_name({ db, project, part_of_speech, position }: { db: D1Database; project: string; part_of_speech: string; position: number }): Promise<string> {
			const sql = `
				SELECT *
				FROM Form_Names
				WHERE project = ?
					AND part_of_speech = ?
					AND position = ?
			`

			return await db.prepare(sql).bind(project, part_of_speech, position).first<string>('name') ?? ''
		}
	}

	function normalize_wildcards(possible_wildcard: string): string {
		return possible_wildcard.replace(/[*#]/g, '%')
	}
}
