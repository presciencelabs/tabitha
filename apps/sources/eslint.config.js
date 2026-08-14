import { fileURLToPath } from 'node:url'
import { includeIgnoreFile } from '@eslint/compat'
import tabithaConfig from '@tabitha/eslint-config'

export default [
	includeIgnoreFile(fileURLToPath(new URL('./.gitignore', import.meta.url))),
	...tabithaConfig,
]
