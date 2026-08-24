export async function get_next_sense({ stem, part_of_speech }: { stem: string, part_of_speech: string }): Promise<string> {
	const res = await fetch(`create/next-sense?stem=${stem}&part_of_speech=${part_of_speech}`)
	const { next_sense } = await res.json()
	return next_sense
}
