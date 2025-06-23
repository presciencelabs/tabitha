/** @type {import('./$types').PageLoad} */
export async function load({ fetch, url }) {
	const response = await fetch(url)
	return await response.json()
}