// @typescript-eslint/consistent-type-definitions has no `extends`-aware option: set to 'type' it
// flags every interface uniformly and rewrites `extends` into an intersection (`X & Base`), which
// would erase the one thing `interface` is for here. This rule fills that gap:
//
//   interface X { a: string }              -->  type X = { a: string }   (fixed by this rule)
//   interface X extends Base { a: string } -->  left alone (extends needs `interface`)
export const plainInterfaceToType = {
	meta: {
		type: 'suggestion',
		fixable: 'code',
		messages: {
			useType: 'This interface has no `extends`; use `type` instead.',
		},
	},
	create(context) {
		return {
			TSInterfaceDeclaration(node) {
				if (node.extends.length) return

				context.report({
					node: node.id,
					messageId: 'useType',
					fix(fixer) {
						const source_code = context.sourceCode ?? context.getSourceCode()
						const type_token = source_code.getTokenBefore(node.id, token => token.value === 'interface')
						const name_end = node.typeParameters ?? node.id
						return [
							fixer.replaceText(type_token, 'type'),
							fixer.replaceTextRange([name_end.range[1], node.body.range[0]], ' = '),
						]
					},
				})
			},
		}
	},
}
