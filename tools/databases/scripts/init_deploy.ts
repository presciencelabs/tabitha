// usage: `bun tools/databases/scripts/init_deploy.ts databases/tbta_db_name(s) [databases/tabitha_db_name(s)] tabitha_db_name`

const input_db_names = Bun.argv.slice(2, -1)
const output_db_name = Bun.argv.at(-1) ?? ''

try {
	check_naming_convention(input_db_names, output_db_name)
	await check_for_existence(input_db_names)
	generate_output_for_github_actions(output_db_name)
} catch (e) {
	console.error(e)
	process.exit(1)
}

function check_naming_convention(input_names: string[], output_name: string) {
	for (const db_name of [...input_names, output_name]) {
		// *.YYYY-MM-DD.tbta.sqlite or *.YYYY-MM-DD.tabitha.sqlite
		const includes_date_and_extension = /\.\d{4}-\d{2}-\d{2}\.(tbta|tabitha)\.sqlite$/

		if (!includes_date_and_extension.test(db_name)) {
			throw `Database name must contain a date stamp, e.g., Bible.1970-01-01.tbta.sqlite, and end in either .tbta.sqlite or .tabitha.sqlite: ${db_name}`
		}
	}
}

async function check_for_existence(input_names: string[]) {
	for (const tbta_db_name of input_names) {
		if (!(await Bun.file(tbta_db_name).exists())) {
			throw `The TBTA database file is missing: ${tbta_db_name}`
		}
	}
}

function generate_output_for_github_actions(output_name: string) {
	const deploy = output_name.replace('.tabitha.sqlite', '')

	console.log(`OUTPUT_DB_NAME=${output_name}`)
	console.log(`OUTPUT_DB_DUMP=${output_name}.sql`)
	console.log(`DEPLOY_DB_NAME=${deploy}`)
}
