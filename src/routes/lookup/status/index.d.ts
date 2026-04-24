type StatusResult = {
	reference: StatusRequestReference
	status: SourceStatus
}

type StatusRequestReference = {
	type?: string
	id_primary: string
	id_secondary?: string
}