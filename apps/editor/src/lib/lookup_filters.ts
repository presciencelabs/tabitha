import type { OntologyStatus } from '@tabitha/types'
import type { CaseFrame } from '$lib/rules/case_frame/types'
function IS_IN_ONTOLOGY(lookup: { ontology_status: OntologyStatus }): boolean {
	return lookup.ontology_status === 'in ontology'
}

function IS_OR_WILL_BE_IN_ONTOLOGY(lookup: { ontology_status: OntologyStatus }): boolean {
	return ['in ontology', 'approved'].includes(lookup.ontology_status)
}

function IS_PART_OF_SPEECH(part_of_speech: string): (lookup: { part_of_speech: string }) => boolean {
	return lookup => lookup.part_of_speech.toLowerCase() === part_of_speech.toLowerCase()
}

function IS_LEVEL(level: number): (lookup: { level: number }) => boolean {
	return lookup => lookup.level === level
}

function IS_LEVEL_SIMPLE(lookup: { level: number }): boolean {
	return [0, 1].includes(lookup.level)
}

function IS_LEVEL_COMPLEX(lookup: { level: number }): boolean {
	return [2, 3].includes(lookup.level)
}

function MATCHES_LOOKUP({ stem, part_of_speech }: { stem: string; part_of_speech: string }): (lookup: { stem: string; part_of_speech: string }) => boolean {
	return lookup => lookup.stem === stem && lookup.part_of_speech === part_of_speech
}

function MATCHES_SENSE({ stem, sense }: { stem: string; sense: string }): (lookup: { stem: string; sense: string }) => boolean {
	return lookup => lookup.stem === stem && lookup.sense === sense
}

function HAS_MISSING_ARGUMENT(argument: string): (lookup: { case_frame: CaseFrame }) => boolean {
	return lookup => lookup.case_frame.result.missing_arguments.some(role_tag => role_tag.includes(argument))
}

function HAS_EXTRA_ARGUMENT(argument: string): (lookup: { case_frame: CaseFrame }) => boolean {
	return lookup => lookup.case_frame.result.extra_arguments.some(({ role_tag }) => role_tag.includes(argument))
}

export const LOOKUP_FILTERS = {
	IS_IN_ONTOLOGY,
	IS_OR_WILL_BE_IN_ONTOLOGY,
	IS_PART_OF_SPEECH,
	IS_LEVEL,
	IS_LEVEL_SIMPLE,
	IS_LEVEL_COMPLEX,
	MATCHES_LOOKUP,
	MATCHES_SENSE,
	HAS_MISSING_ARGUMENT,
	HAS_EXTRA_ARGUMENT,
}
