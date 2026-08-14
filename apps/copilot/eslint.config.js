import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import globals from 'globals'
import svelte from 'eslint-plugin-svelte'
import svelte_parser from 'svelte-eslint-parser'
import ts from 'typescript-eslint'
import { fileURLToPath } from 'node:url'
import { includeIgnoreFile } from '@eslint/compat'

// https://eslint.org/docs/latest/use/configure/configuration-files-new
export default [
	includeIgnoreFile(fileURLToPath(new URL('./.gitignore', import.meta.url))),

	// node_modules/@eslint/js/src/configs/eslint-recommended.js
	js.configs.recommended,
	...ts.configs.recommended,

	// Javascript (eslint's default)
	{
		languageOptions: {
			// https://eslint.org/docs/latest/use/configure/language-options#using-configuration-files-1
			globals: {
				// https://github.com/sindresorhus/globals
				...globals.browser,
				...globals.node,
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

			// https://eslint.style/rules/default/object-curly-spacing
			'@stylistic/object-curly-spacing': ['error', 'always'],

			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off',
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
				parser: ts.parser,
				extraFileExtensions: ['.svelte'],
				projectService: true,
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
]
