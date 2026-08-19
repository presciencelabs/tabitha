import type { SourceEntity } from '@tabitha/types'

export function is_boundary_start(entity: SourceEntity) {
	return ['{', '[', '('].includes(entity.value)
}

export function is_boundary_end(entity: SourceEntity) {
	return ['}', ']', ')'].includes(entity.value)
}