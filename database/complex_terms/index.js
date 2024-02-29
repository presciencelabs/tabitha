import { extract } from './extract'
import { load } from './load'
import { transform } from './transform'

export default {
	// https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/
	async scheduled(event, {DB_Ontology: db}) {
		const extracted_rows = await extract()

		if (extracted_rows.length < 1) {
			return console.log('No need to update database.')
		}

		const data = transform(extracted_rows)

		await load(db)(data)

		// https://developers.cloudflare.com/d1/build-databases/query-databases/#await-stmtfirstcolumn
		const num_terms = await db.prepare('SELECT COUNT(*) AS count FROM Complex_Terms').first('count')
		console.log(`updated ${num_terms} complex terms in database.`)
	}
 }
