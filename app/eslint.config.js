import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import globals from 'globals'
import svelte from 'eslint-plugin-svelte'
import svelte_parser from 'svelte-eslint-parser'
import ts from '@typescript-eslint/eslint-plugin'
import ts_parser from '@typescript-eslint/parser'

// https://eslint.org/docs/latest/use/configure/configuration-files-new
export default [
	{
		ignores: [
			'.wrangler',
			'.svelte-kit',
		],
	},

	// node_modules/@eslint/js/src/configs/eslint-recommended.js
	js.configs.recommended,

	// Javascript (eslint's default)
	{
		languageOptions: {
			// https://eslint.org/docs/latest/use/configure/language-options#using-configuration-files-1
			globals: {
				// https://github.com/sindresorhus/globals
				...globals.browser,
			},
		},

		plugins: {
			'@stylistic': stylistic,
		},

		rules: {
			// https://eslint.style/rules/default/semi
			'@stylistic/semi': ['error', 'never'],

			// https://eslint.style/rules/default/indent
			'@stylistic/indent': ['error', 'tab'],

			// https://eslint.style/rules/default/quotes
			'@stylistic/quotes': [
				'error',
				'single',
				{
					avoidEscape: true,
				},
			],

			// https://eslint.style/rules/default/arrow-parens
			'@stylistic/arrow-parens': ['error', 'as-needed'],

			// https://eslint.style/rules/default/comma-dangle
			'@stylistic/comma-dangle': ['error', 'always-multiline'],

			// https://eslint.org/docs/latest/rules/eqeqeq
			'eqeqeq': 'error',

			// https://eslint.org/docs/rules/no-console
			'no-console': [
				'warn',
				{
					allow: [
						'error',
						'info',
						'warn',
					],
				},
			],

			// https://eslint.org/docs/rules/no-duplicate-imports
			'no-duplicate-imports': 'error',

			// https://eslint.org/docs/latest/rules/no-extra-parens
			'no-extra-parens': 'error',
		},
	},

	// Svelte
	{
		files: [
			'src/**/*.svelte',
		],

		languageOptions: {
			parser: svelte_parser,
			parserOptions: {
				project: '.svelte-kit/tsconfig.json',
			},
		},

		plugins: {
			svelte,
		},

		rules: {
			...svelte.configs.recommended.rules,

			// https://eslint.org/docs/latest/rules/no-inner-declarations
			'no-inner-declarations': 'off',
		},
	},

	// Typescript
	{
		files: [
			'src/**/*.ts',
		],

		languageOptions: {
			parser: ts_parser,
			parserOptions: {
				project: '.svelte-kit/tsconfig.json',
			},
		},

		plugins: {
			'@typescript-eslint': ts,
		},

		rules: {
			...ts.configs.recommended.rules,
		},
	},
]
