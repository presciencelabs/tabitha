import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import globals from 'globals'
import svelte from 'eslint-plugin-svelte'
import svelte_parser from 'svelte-eslint-parser'
import ts from 'typescript-eslint'

// Shared base rules for JavaScript & TypeScript
export const baseConfig = [
	js.configs.recommended,
	...ts.configs.recommended,

	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
		},

		plugins: {
			'@stylistic': stylistic,
		},

		rules: {
			'@stylistic/semi': ['error', 'never'],
			'@stylistic/indent': ['error', 'tab'],
			'@stylistic/quotes': [
				'error',
				'single',
				{
					avoidEscape: true,
				},
			],
			'@stylistic/arrow-parens': ['error', 'as-needed'],
			'@stylistic/comma-dangle': ['error', 'always-multiline'],
			'eqeqeq': 'error',
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
			'no-duplicate-imports': 'error',
			'no-extra-parens': 'error',
			'@stylistic/object-curly-spacing': ['error', 'always'],
			'no-undef': 'off',
		},
	},
]

// Shared rules for Svelte 5 components
export const svelteConfig = [
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
			'no-inner-declarations': 'off',
		},
	},
]

// Shared ignores for build artifacts, cache, and vendor directories
export const ignoreConfig = [
	{
		ignores: [
			'**/node_modules/**',
			'**/.svelte-kit/**',
			'**/.turbo/**',
			'**/.wrangler/**',
			'**/dist/**',
			'**/build/**',
			'**/coverage/**',
			'**/test-results/**',
			'**/playwright-report/**',
			'**/blob-report/**',
			'**/.vite-temp/**',
		],
	},
]

export default [
	...ignoreConfig,
	...baseConfig,
	...svelteConfig,
]
