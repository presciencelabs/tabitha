export function migrate_form_names_table(tbta_db, project, targets_db) {
	const transformed_data = transform_tbta_data(tbta_db)

	create_tabitha_table(targets_db)

	load_data(targets_db, project, transformed_data)
}

/**
 * @typedef {{
* 	part_of_speech: string
* 	name: string
* 	position: number
* }} TransformedData
*
* @param {import('bun:sqlite').Database} tbta_db
* @returns {TransformedData[]}
*/
function transform_tbta_data(tbta_db) {
	const extracted_data = extract()

	const transformed_data = transform()

	return transformed_data

	/**
	* @typedef {{
	* 	part_of_speech: string
	* 	name: string
	* 	FieldName: string
	* }} DbRow
	*
	* @returns {DbRow[]}
	*/
	function extract() {
		console.log(`Extracting form names from ${tbta_db.filename}...`)

		const sql = `
		  SELECT	SyntacticName as part_of_speech,
					FormName as name,
					FieldName

		  FROM	LexicalFormNames
				INNER JOIN	SyntacticCategories
				ON				SyntacticCategory = SyntacticCategories.ID

		  ORDER BY SyntacticCategory
	  `

		const results = tbta_db.prepare(sql).all()

		console.log('done.')

		return results
	}

	/** @returns {TransformedData[]} */
	function transform() {
		console.log(`Transforming data from ${tbta_db.filename}...`)

		const transformed_data = extracted_data.map(({part_of_speech, name, FieldName}) => ({
			part_of_speech,
			name,
			position: FieldName.match(/(\d+)/)[1], // FieldName pattern:  "Form Name 1", "Form Name 2", etc.
		}))

		console.log('done.')

		return transformed_data
	}
}

function create_tabitha_table(targets_db) {
	console.log(`Creating Form_Names table in ${targets_db.filename}...`)

	targets_db.query(`
		CREATE TABLE IF NOT EXISTS Form_Names (
			project			TEXT,
			part_of_speech	TEXT,
			name				TEXT,
			position			INTEGER
		)
	`).run()

	console.log('done.')

	return targets_db
}

/**
 * @param {import('bun:sqlite').Database} targets_db
 * @param {string} project
 * @param {TransformedData[]} transformed_data
 */
function load_data(targets_db, project, transformed_data) {
	console.log(`Loading data into Form_Names table...`)

	transformed_data.map(async ({part_of_speech, name, position}) => {
		targets_db.query(`
			INSERT INTO Form_Names (project, part_of_speech, name, position)
			VALUES (?, ?, ?, ?)
			`).run(project, part_of_speech, name, position)

		await Bun.write(Bun.stdout, '.')
	})

	console.log('done.')
}
