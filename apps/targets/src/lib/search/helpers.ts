import { by_book_order } from '@tabitha/types'
import type { FilterMap, SearchTextResult } from '../types'

export { by_book_order }

export function build_filter_options(matches: SearchTextResult[]): FilterMap {
	const filter_map: FilterMap = new Map()

	const book_names_found_in_examples = [...new Set(matches.slice().sort(by_book_order).map(result => result.reference.id_primary))]
	filter_map.set('Book', ['Any', ...book_names_found_in_examples])

	const audiences_found_in_examples = [...new Set(matches.flatMap(result => result.texts.map(t => t.audience)))].sort()
	filter_map.set('Audience', ['Any', ...audiences_found_in_examples])

	return filter_map
}

export function filter_search_results(matches: SearchTextResult[], selected_filters: Record<string, string>): SearchTextResult[] {
	return matches.filter(result => {
		const selected_book = selected_filters['Book']
		if (selected_book && selected_book !== 'Any' && result.reference.id_primary !== selected_book) {
			return false
		}

		const selected_audience = selected_filters['Audience']
		if (selected_audience && selected_audience !== 'Any' && !result.texts.some(t => t.audience === selected_audience)) {
			return false
		}

		return true
	})
}

export function build_search_regex(search_terms: string[]): RegExp {
	if (!search_terms.length) {
		return /(?:)/gi
	}
	const pattern = search_terms.join('|').toLowerCase().replaceAll(/[%#*]/g, '.*?')
	return new RegExp(`(${pattern})`, 'gi')
}
