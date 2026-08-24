import tabithaConfig from '@tabitha/eslint-config'

export default [
	...tabithaConfig,

	// These are CLI tools run directly by a developer/CI, so console output is
	// the intended product rather than debug noise to be flagged.
	{
		rules: {
			'no-console': 'off',
		},
	},
]
