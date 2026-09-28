import type { D1Database } from '@cloudflare/workers-types'
import { get_all_verses_in_chapter } from './zoho'
import type { ChapterReference, Reference } from '@tabitha/types'

export async function sync_in_progress_phase_1(db: D1Database): Promise<void> {
	const chapters_to_sync = await get_chapters_in_progress(db)

	if (chapters_to_sync.length < 1) {
		console.info('No chapters are in progress.')
		return
	}

	const update_stmt = db.prepare(`
		UPDATE Sources
		SET phase_1_encoding = ?
		WHERE type = 'Bible' AND id_primary = ? AND id_secondary = ? AND id_tertiary = ?
			AND (status = 'Initial Analysis in Progress' OR (status = 'Initial Analysis Complete' AND semantic_encoding = ''))
	`)

	for (const chapter of chapters_to_sync) {
		console.info(`Fetching phase 1 for ${chapter.book} ${chapter.chapter}.`)
		const verse_data = await get_all_verses_in_chapter(chapter)
		
		if (verse_data.length < 1) {
			console.info(`No phase 1 found for any verses within ${chapter.book} ${chapter.chapter}.`)
			return
		}

		const update_stmts = verse_data.map(({ verse: { book, chapter, verse }, he2 }) => 
			// all the ids in the db are TEXT, so numbers won't match
			update_stmt.bind(he2, book, chapter.toString(), verse.toString())
		)

		console.info(`Updating phase 1 for ${verse_data.length} verses in ${chapter.book} ${chapter.chapter}...`)

		try {
			await db.batch(update_stmts)
			console.info(`Successfully updated phase 1 for ${verse_data.length} verses in ${chapter.book} ${chapter.chapter} in D1 database.`)
		} catch (error) {
			const message = error instanceof Error ? error.message : `${error}`
			console.warn(`Error updating phase 1 for ${chapter.book} ${chapter.chapter}: ${message}`)
		}

	}

	console.info(`Done phase 1 scraping from Zoho.`)
}

async function get_chapters_in_progress(db: D1Database): Promise<ChapterReference[]> {
	const sql = `
		SELECT id_primary, id_secondary FROM ChapterStatus
		WHERE status = 'Initial Analysis in Progress' OR status = 'Initial Analysis Complete'
	`
	const { results } = await db.prepare(sql).all<Pick<Reference, 'id_primary' | 'id_secondary'>>()
	return results.map(result => ({ book: result.id_primary, chapter: Number(result.id_secondary) }))
		// .filter(r => r.book === 'Jeremiah').slice(0, 1)
}
