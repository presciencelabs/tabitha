
import { get_matches } from './tree_pattern_match'
import { simple_feature_flags } from './simple_feature_flags'
import { implicit_feature_flags } from './implicit_flags'
import { higher_level_flags } from './higher_level_flags'

const all_flag_extractions: FlagExtractionRule[] = [
	...simple_feature_flags,
	...implicit_feature_flags,
	...higher_level_flags
]

export function extract_flags(entities: EncodingEntity[]): CopilotTriggerFlag[] {
	let root_node: EncodingEntity = {
		category: 'Root',
		children: entities,
	}

	const matches = get_matches(root_node, all_flag_extractions)
	return matches.map(flag_from_match).filter(f => !!f)
}

function extract_value(match: EntityMatchResult): string | undefined {
	const rule = match.rule
	if (rule.value === undefined) {
		return undefined
	} else if (typeof rule.value === 'string') {
		return rule.value.replaceAll(/\$\w+/g, m => match.bindings[m])
	} else {
		return rule.value(match)
	}
}

function flag_from_match(match: EntityMatchResult): CopilotTriggerFlag | undefined {
	const value = extract_value(match)
	if (!value) {
		return undefined
	}

	const anchor_name = '$anchor' in match.captures ? '$anchor' : Object.keys(match.captures)[0]
	const anchor_node = match.captures[anchor_name]
	const node_id = anchor_node?.indexStack.join('.') ?? ''
	const node_category = anchor_node?.node.category ?? ''
	const anchor_entries = Object.entries(match.bindings).map(([key, value]) => ([key.replace('$', ''), String(value)]))

	return {
		name: match.flag,
		value,
		encoding_anchor: {
			node_id,
			category: node_category,
			...Object.fromEntries(anchor_entries),
			...match.rule.anchor_extra?.(match),
		}
	}
}