import { get_all_book_statuses } from '$lib/data/status'
import { ordered_primary_ids, primary_id_groupings } from '$lib/data/lookups.js'

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals: { db }, params: { type } }) {
	const statuses = await get_all_book_statuses(db, type)

	// group and order the primary_ids
	const groupings = primary_id_groupings[type] || { [type]: [1, statuses.length] }
	const primary_id_to_order_map = Object.fromEntries(Object.entries(ordered_primary_ids[type]).map(([i, name]) => ([name, Number(i)])))

	let status_groups = Object.entries(groupings).map(([group_name, range]) => {
		const [start, end] = range
		const group_statuses = statuses.filter(({ reference: { id_primary } }) => {
			const order = primary_id_to_order_map[id_primary]
			return order >= start && order <= end
		}).toSorted((a, b) => primary_id_to_order_map[a.reference.id_primary] - primary_id_to_order_map[b.reference.id_primary])
		return {
			group_name,
			statuses: group_statuses,
		}
	})

	return {
		status_groups,
	}
}