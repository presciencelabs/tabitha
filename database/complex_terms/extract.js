
/** @returns {Promise<string[]>} */
export async function extract() {
	console.log('fetching latest data')

	const response = await fetch('https://docs.google.com/spreadsheets/d/16_U4MqhwHNd9fR9Ai5ZeAI4AzBFGEAi3KhNyMQbEHlM/export?format=tsv&gid=0')

	/** @type {string} */
	const raw_data = await response.text()

	// skip first two rows (headers)
	/** @type {string[]} */
	const [,, ...rows] = raw_data.split(/\r?\n/)

	console.log(`received ${rows.length} rows from spreadsheet`)

	return rows
}
