import { Glob } from 'bun'
import { join, basename } from 'path'
import { mkdir } from 'fs/promises'

const parts_of_speech_map: Record<string, string> = {
	'nouns': 'Noun',
	'verbs': 'Verb',
	'adjectives': 'Adjective',
	'adverbs': 'Adverb'
}

export async function transform_inflections(dir: string = '.') {
	const win_dir = join(dir, 'win')
	const unix_dir = join(dir, 'unix')
	const csv_dir = join(dir, 'csv')

	await mkdir(unix_dir, { recursive: true })
	await mkdir(csv_dir, { recursive: true })

	const files = Array.from(new Glob('*.win.txt').scanSync(win_dir))

	for (const win_file of files) {
		const full_win_file = join(win_dir, win_file)
		const base_unix_name = basename(win_file, '.win.txt') + '.txt'
		const full_unix_file = join(unix_dir, base_unix_name)

		console.log(`converting ${full_win_file} => ${full_unix_file}`)

		const raw_content = await Bun.file(full_win_file).text()
		// Sanitize raw TBTA file outputs by stripping out any corrupted bytes or non-printable ASCII characters 
		// (this regex strictly retains tabs \x09, newlines \x0A, carriage returns \x0D, and visible text \x20-\x7E)
		const cleaned_content = raw_content.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
		await Bun.write(full_unix_file, cleaned_content)

		const match = base_unix_name.match(/lexical_forms_(.*?)\.txt$/)
		if (!match) continue

		const pos_key = match[1] // e.g., 'nouns'
		const part_of_speech = parts_of_speech_map[pos_key] ||
			pos_key.charAt(0).toUpperCase() + pos_key.slice(1, -1)

		const csv_filename = `${pos_key}.csv`
		const full_csv_file = join(csv_dir, csv_filename)

		console.log(`transforming unix/${base_unix_name} => ${csv_filename}`)

		const csv_content = process_to_csv(cleaned_content, part_of_speech)
		await Bun.write(full_csv_file, csv_content)
	}
}

function process_to_csv(content: string, part_of_speech: string): string {
	// TBTA files are generated in a Windows environment resulting in '\r\n' line endings.
	// If the invisible carriage return ('\r') is not stripped, it remains attached to the extracted
	// word stem and breaks exact string matching downstream during the Lexicon DB migration.
	const lines = content.replace(/\r/g, '').split('\n')
	
	const extracted_data = new Map<string, string[]>()
	let current_key: string | null = null

	for (const line of lines) {
		if (!line) continue

		const MATCH_STEM_LINE = /^(\d+)\.\s+(.+)$/
		const match = line.match(MATCH_STEM_LINE)

		if (match) {
			const sequence_number = match[1]
			const stem = match[2]
			current_key = `${sequence_number}:${stem}`
			extracted_data.set(current_key, [])
			continue
		}

		if (current_key) {
			const parts = line.split(':')
			if (parts.length > 1) {
				const inflection = parts[1].trim()
				const ADDITIONAL_INFO = / {3}\(\w+\)/ // e.g.,   (suppletive)
				const normalized_inflection = inflection.replace(ADDITIONAL_INFO, '')
				extracted_data.get(current_key)!.push(normalized_inflection)
			}
		}
	}

	const output: string[] = []
	for (const [key, inflections] of extracted_data) {
		const [sequence_number, stem] = key.split(':')
		output.push(`${sequence_number},${stem},${part_of_speech},|${inflections.join('|')}|`)
	}
	return output.join('\n')
}

// Allow running from CLI directly
if (import.meta.main) {
	const dir = process.argv[2] ?? '.'
	await transform_inflections(dir)
}
