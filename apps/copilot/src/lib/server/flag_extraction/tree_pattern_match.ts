
/**
 * Check whether a value is a variable
 *
 * Variables begin with "$"
 */
function isVariable(value: unknown): value is string {
	return typeof value === 'string' && value.startsWith('$')
}

/**
 * Deep clone JSON-compatible data
 */
function clone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value))
}

/**
 * Resolve a variable through bindings
 */
function resolveVariable(variable: string, bindings: Record<string, unknown>): unknown {
	let current: unknown = variable

	while (isVariable(current) && bindings[current] !== undefined && bindings[current] !== current) {
		current = bindings[current]
	}

	return current
}

/**
 * Compare two values recursively
 */
function matchValue(a: unknown, b: unknown, bindings: Record<string, unknown> = {}) {
	const localBindings = clone(bindings)

	const result = matchValueInternal(a, b, localBindings)

	if (!result) {
		return null
	}

	return {
		success: result,
		bindings: localBindings,
	}
}

/**
 * Internal recursive matching
 */
function matchValueInternal(actual: unknown, pattern: unknown, bindings: Record<string, unknown>): boolean {
	// resolve bound vars
	// There should be no variables in 'actual', but they can be in 'pattern'
	if (isVariable(pattern)) {
		const resolved = resolveVariable(pattern, bindings)

		if (resolved !== pattern) {
			return matchValueInternal(actual, resolved, bindings)
		}
	}

	if (isVariable(pattern)) {
		bindings[pattern] = actual
		return Boolean(actual)
	}

	// values can only be objects or strings
	// the only array would be 'children', which is handled separately

	if (actual === null || pattern === null || actual === undefined || pattern === undefined) {
		return actual === pattern
	}

	// strings
	if (typeof pattern === 'string') {
		const bValues = pattern.split('|').map(v => v.trim())
		return bValues.includes(String(actual))
	}

	// objects (pretty much only 'features')
	if (typeof pattern === 'object' && typeof actual === 'object') {
		const patternObj = pattern as Record<string, unknown>
		const actualObj = actual as Record<string, unknown>
		for (const key of Object.keys(patternObj)) {
			if (!(key in actualObj)) {
				return false
			}
			const value_match = matchValueInternal(actualObj[key], patternObj[key], bindings)
			if (!value_match) {
				return false
			}
		}
		return true
	}

	return actual === pattern
}

/**
 * Check whether a node matches a structural pattern
 *
 * Supports:
 *	- recursive structure matching
 *	- variable unification
 *	- named captures
 */
function matchPattern(node: EncodingEntity, pattern: PatternEntity, bindings: Record<string, unknown> = {}, captures: Record<string, EntityMatchCapture> = {}, stack: IndexStack = []): EntityMatch {
	const localBindings = clone(bindings)
	const localCaptures = clone(captures)

	// capture
	if (pattern.name) {
		localCaptures[pattern.name] = {
			node,
			indexStack: stack,
		}
	}

	// check non-children properties
	for (const key of Object.keys(pattern) as (keyof EncodingEntity | keyof PatternEntity)[]) {
		if (key === 'children' || key === 'name' || key === 'optional') {
			continue
		}

		if (!(key in node)) {
			return { success: false, bindings, captures }
		}

		const result = matchValue(node[key], pattern[key], localBindings)

		if (!result) {
			return { success: false, bindings, captures }
		}

		Object.assign(localBindings, result.bindings)
	}

	// unordered child matching
	if (pattern.children) {
		if (!node.children) {
			return { success: false, bindings, captures }
		}

		const usedChildren = new Set()

		for (const childPattern of pattern.children) {
			let matched = false

			for (let i = 0; i < node.children.length; i++) {
				if (usedChildren.has(i)) {
					continue
				}

				const childNode = node.children[i]

				const result = matchPattern(childNode, childPattern, localBindings, localCaptures, [...stack, i])

				if (result.success) {
					usedChildren.add(i)

					Object.assign(localBindings, result.bindings)
					Object.assign(localCaptures, result.captures)

					matched = true
					break
				}
			}

			if (!matched && !childPattern.optional) {
				return { success: false, bindings, captures }
			}
		}
	}

	return { success: true, bindings: localBindings, captures: localCaptures }
}

export function get_matches(root_entity: EncodingEntity, extractions: FlagExtractionRule[]): EntityMatchResult[] {
	function traverseDFS(node: EncodingEntity, stack: IndexStack = []): EntityMatchResult[] {
		const matches: EntityMatchResult[] = []

		for (const { flag, rules } of extractions) {
			for (const rule of rules) {
				const match = matchPattern(node, rule.pattern, {}, {}, stack)
				if (match.success) {
					matches.push({ ...match, flag, rule })
					// Once a rule matches, don't check the other rules for the same flag
					continue
				}
			}
		}

		if (node.children) {
			for (let i = 0; i < node.children.length; i++) {
				matches.push(...traverseDFS(node.children[i], [...stack, i]))
			}
		}
		
		return matches
	}
	
	return traverseDFS(root_entity)
}

/**
 * Create a recursive tree matcher
 *
 * Searches entire structure DFS
 */
export function match_pattern(pattern: PatternEntity, root_entity: EncodingEntity): EntityMatch[] {
	function traverseDFS(node: EncodingEntity, stack: IndexStack = []): EntityMatch[] {
		const matches: EntityMatch[] = []

		const result = matchPattern(node, pattern, {}, {}, stack)
		if (result.success) {
			matches.push(result)
		}
		if (node.children) {
			for (let i = 0; i < node.children.length; i++) {
				matches.push(...traverseDFS(node.children[i], [...stack, i]))
			}
		}
		return matches
	}

	return traverseDFS(root_entity)
}