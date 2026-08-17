import Database from 'bun:sqlite'

export function migrate_text_table(tbta_db: Database, project: string, targets_db: Database) {
	const transformed_data = transform_tbta_data(tbta_db)

	create_tabitha_table(targets_db)

	load_data(targets_db, project, transformed_data)
}

type TransformedData = {
	book: string
	chapter: number
	verse: number
	audience: string
	text: string
}
function transform_tbta_data(tbta_db: Database): TransformedData[] {
	const table_names = extract_table_names()
	const audience_names = extract_audience_names()
	const transformed_data = transform_data(table_names, audience_names)

	return transformed_data

	function extract_table_names() {
		console.log(`Extracting relevant table names from ${tbta_db.filename}...`)

		// https://bun.sh/docs/api/sqlite#reference
		const tbta_tablenames_for_bible_books = tbta_db.query<{ name: string }, []>(`
			SELECT *
			FROM sqlite_master
			WHERE type = 'table'
				AND name like 'Target_EB_%'
		`).all().map(({ name }) => name)

		console.log('done.')

		return tbta_tablenames_for_bible_books
	}

	function extract_audience_names() {
		console.log(`Extracting audience names from ${tbta_db.filename}...`)

		const tbta_audiences = tbta_db.prepare<{ Audiences: string }, []>(`
			SELECT Audiences
			FROM Properties
			LIMIT 1
		`).get()?.Audiences ?? ''

		const audience_names = [...tbta_audiences.matchAll(/\^(.+?);/g)].map(m => m[1])

		console.log('done.')

		return audience_names
	}

	function transform_data(table_names: string[], audience_names: string[]) {
		console.log(`Transforming data from ${tbta_db.filename}...`)

		type DbRow = { Reference: string, Verse: string }
		const transformed_data = table_names.map(table_name => tbta_db.query<DbRow, []>(`
				SELECT Reference, Verse
				FROM ${table_name}
				WHERE Reference NOT NULL
			`).all().map(transform).flat() // array of books
		).flat() // flattens all 66 books into one array of all verses

		console.log('done.')

		return transformed_data

		function transform({ Reference, Verse }: DbRow): TransformedData[] {
			if (!Verse) return []

			// References are expected to look like this: "Daniel 3:9", "1 Chronicles 1:1", etc.
			const [, book, chapter, verse] = /(.*) (\d+):(\d+)/.exec(Reference) ?? []

			// Each audience text is separated on its own line, and may or may not be followed by annotated text marked with '~!~'
			// A line may be blank if there is no saved text for that audience
			return Verse
				.split(/\r?\n/) // guarding against os-specific line endings
				.flatMap(extract_audience_text) // used flatMap to combine line cleaning, audience mapping, and skipping blank lines in a single pass

			function extract_audience_text(line: string, index: number): TransformedData[] {
				const text = line.split('~!~')[0].trim()
				if (!text) return []

				return [{
					book,
					chapter: Number(chapter),
					verse: Number(verse),
					audience: audience_names[index],
					text,
				}]
			}
		}
	}
}

function create_tabitha_table(targets_db: Database) {
	console.log(`Creating the "Text" table in ${targets_db.filename} if it does not already exist...`)

	targets_db.run(`
		CREATE TABLE IF NOT EXISTS Text (
			project		TEXT,
			book		TEXT,
			chapter		INTEGER,
			verse		INTEGER,
			audience	TEXT,
			text		TEXT
		)
	`)

	console.log('done.')

	return targets_db
}

function load_data(targets_db: Database, project: string, transformed_data: TransformedData[]) {
	console.log(`Loading ${project} data into the "Text" table...`)

	transformed_data.map(async ({ book, chapter, verse, audience, text }) => {
		targets_db.run(`
			INSERT INTO Text (project, book, chapter, verse, audience, text)
			VALUES (?, ?, ?, ?, ?, ?)
		`, [project, book, chapter, verse, audience, text])

		await Bun.write(Bun.stdout, '.')
	})

	console.log('done.')
}
