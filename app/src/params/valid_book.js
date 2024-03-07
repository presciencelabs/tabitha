/** @type {import('@sveltejs/kit').ParamMatcher} */
export function match(param) {
	// covers numbered books, e.g., 1 Chronicles, 3 John
	return /^[a-zA-Z0-3 ]+$/.test(param)
}