export function migrate_text_table(tbta_db, project, targets_db) {
	const transformed_data = transform_tbta_data(tbta_db)

	create_tabitha_table(targets_db)

	load_data(targets_db, project, transformed_data)
}

/** @param {import('bun:sqlite').Database} tbta_db */
function transform_tbta_data(tbta_db) {
	const table_names = extract_table_names()
	const transformed_data = transform_data(table_names)

	return transformed_data

	function extract_table_names() {
		console.log(`Extracting relevant table names from ${tbta_db.filename}...`)

		// https://bun.sh/docs/api/sqlite#reference
		const tbta_tablenames_for_bible_books = tbta_db.query(`
			SELECT *
			FROM sqlite_master
			WHERE type = 'table'
				AND name like 'Target_EB_%'
		`).all().map(({name}) => name)

		console.log('done.')

		return tbta_tablenames_for_bible_books
	}

	function transform_data(table_names) {
		console.log(`Transforming data from ${tbta_db.filename}...`)

		const transformed_data = table_names.map(table_name => tbta_db.query(`
				SELECT Reference, Verse
				FROM ${table_name}
				WHERE Reference NOT NULL
			`).all().map(transform) // array of books
		).flat() // flattens all 66 books into one array of all verses

		console.log('done.')

		return transformed_data

		function transform({Reference, Verse}) {
			// References are expected to look like this: "Daniel 3:9"
			const [, book, chapter, verse] = /(.*) (\d+):(\d+)/.exec(Reference)

			// Verse looks like this: "Those astrologers said to King Nebuchadnezzar, “May you, the king, live forever!~!~(NP those[Pre-Nominal] astrologer+s[Plural] ) (VP said ) (NP to (NP _ King ) Nebuchadnezzar ) [ ,_“ (VP may[CP-VP] ) (NP you (NP , the[Pre-Nominal] king , ) ) (VP live ) (AdvP forever ) ! ] . Those astrologers said to King Nebuchadnezzar, “May you, the king, live forever! Those astrologers said to the king, “We hope that you'll live forever.~!~(NP those[Pre-Nominal] astrologer+s[Plural] ) (VP said ) (NP to the[Pre-Nominal] king ) [ ,_“ (NP we ) (VP hope ) [ that[Complementizer] (NP you ) (VP will[Pre-Verbal] live ) (AdvP forever ) ] ] . "
			// 	note: can also be empty
			const [, text] = /(.*?)~!~/.exec(Verse) ?? [,'']

			return {
				book,
				chapter: Number(chapter),
				verse: Number(verse),
				text,
			}
		}
	}
}

/** @param {import('bun:sqlite').Database} targets_db */
function create_tabitha_table(targets_db) {
	console.log(`Creating Text table in ${targets_db.filename}...`)

	targets_db.query(`
		CREATE TABLE IF NOT EXISTS Text (
			project	TEXT,
			book 		TEXT,
			chapter 	INTEGER,
			verse 	INTEGER,
			text 		TEXT
		)
	`).run()

	console.log('done.')

	return targets_db
}

/** @param {import('bun:sqlite').Database} targets_db */
function load_data(targets_db, project, transformed_data) {
	console.log(`Loading data into Text table...`)

	transformed_data.map(async ({book, chapter, verse, text}) => {
		targets_db.query(`
			INSERT INTO Text (project, book, chapter, verse, text)
			VALUES (?, ?, ?, ?, ?)
		`).run(project, book, chapter, verse, text)

		await Bun.write(Bun.stdout, '.')
	})

	console.log('done.')
}
