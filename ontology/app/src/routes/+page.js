/** @type {import('./$types').PageLoad} */
export async function load({ url: { searchParams } }) {
	const q = searchParams.get('query')
	
	let matches = !q ? [] : [
		{
			id: 1,
			stem: 'stub1',
		},
		{
			id: 2,
			stem: 'stub2',
		},
		{
			id: 3,
			stem: 'stub3',
		},
		{
			id: 4,
			stem: 'stub4',
		},
		{
			id: 5,
			stem: 'stub5',
		},
	]
	
	return {
		matches
	}
}
