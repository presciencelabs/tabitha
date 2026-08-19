import type { SourceStatus } from '@tabitha/types'

export type StatusRequestReference = {
	type?: string
	id_primary: string
	id_secondary?: string
}

export type StatusResult = {
	reference: StatusRequestReference
	status: SourceStatus
}
