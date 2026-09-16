import type { ConceptKey } from '@tabitha/types'
import type { Concept } from './types'

export function do_concepts_match({ a, b }: { a: ConceptKey | Concept, b: ConceptKey | Concept }): boolean {
	return a.stem === b.stem && a.sense === b.sense && a.part_of_speech === b.part_of_speech
}

export async function get_next_sense({ stem, part_of_speech }: { stem: string, part_of_speech: string }): Promise<string> {
	const res = await fetch(`create/next-sense?stem=${stem}&part_of_speech=${part_of_speech}`)
	const { next_sense } = await res.json()
	return next_sense
}
