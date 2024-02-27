import {Database} from 'bun:sqlite'

const db = new Database(Bun.argv[2])

// https://bun.sh/docs/api/sqlite#reference
db.query(`
	CREATE TABLE IF NOT EXISTS Complex_Terms (
		'term' 				TEXT,
		'part_of_speech' 	TEXT,
		'pairing' 			TEXT,
		'explication' 		TEXT
	)
`).run()

console.log('fetching latest data')
const response = await fetch('https://docs.google.com/spreadsheets/d/16_U4MqhwHNd9fR9Ai5ZeAI4AzBFGEAi3KhNyMQbEHlM/export?format=tsv&gid=0')
const raw_csv = await response.text()

// skip first two rows (headers)
const [,, ...data_rows] = raw_csv.split(/\r?\n/)
console.log(`received ${data_rows.length} rows`)

if (data_rows.length < 1) {
	console.log('nothing to add.')
	process.exit()
}

console.log('updating table with latest data')
// https://bun.sh/docs/api/sqlite#transactions
db.transaction(insert)(data_rows)

function insert(rows) {
	clear()

	add()

	function clear() {
		console.log('clearing current data')

		db.query('DELETE FROM Complex_Terms').run()
	}

	async function add() {
		console.log('inserting new data')

		const insert_stmt = db.prepare('INSERT INTO Complex_Terms VALUES (?, ?, ?, ?)')

		for (const row of rows) {
			const [term, part_of_speech, , pairing, explication,] = row.split('\t')

			insert_stmt.run(term, part_of_speech, pairing, explication)

			await Bun.write(Bun.stdout, '.')
		}

		console.log('Done!')
	}
}
