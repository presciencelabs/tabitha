import stylistic from '@stylistic/eslint-plugin'
import js from '@eslint/js'
import globals from 'globals'

// https://eslint.org/docs/latest/use/configure/configuration-files-new
export default [
	{
		files: [
			'src/*',
		],
		languageOptions: {
			globals: {
				...globals.browser
			},
		},
		plugins: {
			'@stylistic': stylistic,
		},
		rules: {
			...js.configs.recommended.rules,

			'no-console': [ // https://eslint.org/docs/rules/no-console
				'warn',
				{
					allow: [
						'warn',
						'error'
					],
				},
			],
			'sort-imports': 'error', // https://eslint.org/docs/rules/sort-imports
			'no-duplicate-imports': 'error', // https://eslint.org/docs/rules/no-duplicate-imports

			'@stylistic/semi': ['error', 'never'], // https://eslint.style/rules/default/semi
			'@stylistic/indent': ['error', 'tab'], // https://eslint.style/rules/default/indent
			'@stylistic/quotes': [ // https://eslint.style/rules/default/quotes
				'error',
				'single',
				{
					avoidEscape: true
				}
			],
			'@stylistic/arrow-parens': ["error", "as-needed"], // https://eslint.style/rules/default/arrow-parens
			'@stylistic/comma-dangle': ["error", "always-multiline"], // https://eslint.style/rules/default/comma-dangle
		},
	},
]
