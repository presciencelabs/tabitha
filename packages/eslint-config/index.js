import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import globals from 'globals'
import import_x from 'eslint-plugin-import-x'
import svelte from 'eslint-plugin-svelte'
import svelte_parser from 'svelte-eslint-parser'
import ts from 'typescript-eslint'
import { includeIgnoreFile } from '@eslint/compat'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { plainInterfaceToType } from './rules/plain_interface_to_type.js'
import { pureTypeTopLevel } from './rules/pure_type_top_level.js'

const root_gitignore_path = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.gitignore')

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
			'import-x': import_x,
			local: {
				rules: {
					'plain-interface-to-type': plainInterfaceToType,
					'pure-type-top-level': pureTypeTopLevel,
				},
			},
		},

		rules: {
			'@typescript-eslint/consistent-generic-constructors': ['error', 'constructor'],
			'@typescript-eslint/consistent-type-imports': [
				'error',
				{ prefer: 'type-imports', fixStyle: 'separate-type-imports', disallowTypeAnnotations: false },
			],
			'import-x/no-duplicates': ['error', { 'prefer-inline': true }],
			'local/plain-interface-to-type': 'error',
			'local/pure-type-top-level': 'error',
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
			'no-extra-parens': 'error',
			'@stylistic/object-curly-spacing': ['error', 'always'],
			'no-undef': 'off',
		},
	},

	// SvelteKit's ambient app.d.ts declares its App.Locals/Platform/etc. as `interface` so they
	// can merge with SvelteKit's own ambient declarations -- `type` can't do that merging.
	{
		files: ['**/app.d.ts'],
		rules: {
			'local/plain-interface-to-type': 'off',
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

// Ignores for build artifacts, cache, and vendor directories -- derived from the repo's own
// .gitignore so the two never drift apart, plus committed-but-generated files that
// .gitignore doesn't (and shouldn't) cover.
export const ignoreConfig = [
	includeIgnoreFile(root_gitignore_path),
	{
		ignores: [
			'**/worker-configuration.d.ts',
		],
	},
]

export default [
	...ignoreConfig,
	...baseConfig,
	...svelteConfig,
]
