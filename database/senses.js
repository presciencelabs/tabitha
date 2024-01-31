import {Database} from 'bun:sqlite'

const db = new Database(Bun.argv[2])

// https://bun.sh/docs/api/sqlite#reference
const concepts = db.query(`
	SELECT 	 id
				,stem
				,part_of_speech
	FROM Concepts
	ORDER BY stem, part_of_speech, id
`)

const sensed_concepts = derive_senses(concepts.all())

console.log('adding senses to db')
sensed_concepts.map(async ({id, sense}) => {
	db.query(`
		UPDATE Concepts
		SET sense = ?
		WHERE id = ?
	`)
	.run(sense, id)

	await Bun.write(Bun.stdout, '.')
})

console.log('Done!')

function derive_senses(concepts) {
	const sensed_concepts = []
	const sense_tracker = new Map()

	for (const concept of concepts) {
		const {stem, part_of_speech} = concept
		const key = `${stem}:${part_of_speech}`
		const sense = sense_tracker.get(key) || 'A'

		sensed_concepts.push({
			...concept,
			sense,
		})

		sense_tracker.set(key, next_sense(sense))
	}

	return sensed_concepts

	/**
	 * @param {string} sense - a single character that started with 'A'
	 *
	 * @returns {string} - the next character in the alphabet
	 */
	function next_sense(sense) {
		return String.fromCharCode(sense.charCodeAt(0) + 1)
	}
}
