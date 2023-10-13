/** @type {import('prettier').Config} https://prettier.io/docs/en/options */
module.exports = {
	arrowParens: 'avoid',
	bracketSpacing: false,
	printWidth: 9999,
	semi: false,
	singleAttributePerLine: false,
	singleQuote: true,
	trailingComma: 'es5',
	useTabs: true,

	plugins: [
		'@trivago/prettier-plugin-sort-imports', // https://github.com/trivago/prettier-plugin-sort-imports
		'prettier-plugin-svelte', // https://github.com/sveltejs/prettier-plugin-svelte
		'prettier-plugin-tailwindcss', // https://github.com/tailwindlabs/prettier-plugin-tailwindcss
	],
}
