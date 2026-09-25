import type { EntityFeature } from '@tabitha/types'

export function get_features_to_display({ value }: EntityFeature): boolean {
	return !(value === 'No' || ['Un', 'No ', 'Not '].some(prefix => value.startsWith(prefix)))
}
