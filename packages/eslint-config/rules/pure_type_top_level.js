// Fills the one gap import-x/no-duplicates + @typescript-eslint/consistent-type-imports leave open:
//
//   import { type A, type B } from 'x'   -->  import type { A, B } from 'x'   (fixed by this rule)
//   import { A, type B } from 'x'        -->  left alone (mixed; handled by the other two rules)
//   import type { A, B } from 'x'        -->  left alone (already correct)
//
// Delete this rule once eslint-plugin-import-x ships a `prefer-top-level-if-only-type-imports`
// option for consistent-type-specifier-style and switch to that instead:
// https://github.com/un-ts/eslint-plugin-import-x/issues/501
export const pureTypeTopLevel = {
	meta: {
		type: 'suggestion',
		fixable: 'code',
		messages: {
			useTopLevelType: 'All specifiers are types; use `import type { ... }` instead.',
		},
	},
	create(context) {
		return {
			ImportDeclaration(node) {
				if (node.importKind === 'type' || !node.specifiers.length) return

				const named_specifiers = node.specifiers.filter(specifier => specifier.type === 'ImportSpecifier')

				const is_all_inline_types = named_specifiers.length === node.specifiers.length
					&& named_specifiers.every(specifier => specifier.importKind === 'type')

				if (!is_all_inline_types) return

				context.report({
					node,
					messageId: 'useTopLevelType',
					fix(fixer) {
						const source_code = context.sourceCode ?? context.getSourceCode()
						const specifier_text = named_specifiers
							.map(specifier => {
								const imported_text = source_code.getText(specifier.imported)
								const local_text = source_code.getText(specifier.local)
								return imported_text === local_text ? local_text : `${imported_text} as ${local_text}`
							})
							.join(', ')
						const source_text = JSON.stringify(node.source.value)
						return fixer.replaceText(node, `import type { ${specifier_text} } from ${source_text}`)
					},
				})
			},
		}
	},
}
