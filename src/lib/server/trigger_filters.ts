
type TriggerTemplate = {
	name: string
	flags: string[]
	avg_divisor: 'present_flags' | 'possible_flags'
	trigger_grouper?: (trigger: TriggerData) => string
}

type TriggerData = {
	name: string
	node_id: string
	flags: CopilotWeightedFlag[]
	weight: number
}

const triggers: TriggerTemplate[] = [
	{
		name: 'TAMP',
		flags: ['Verb Time', 'Verb Aspect', 'Verb Mood', 'Verb Polarity'],
		avg_divisor: 'possible_flags',
	},
	{
		name: 'Noun Person',
		flags: ['Noun Person'],
		avg_divisor: 'present_flags',
		trigger_grouper: t => `${t.flags[0].encoding_anchor['noun_index']}-${t.flags[0].value}`
	},
	{
		name: 'Noun Number',
		flags: ['Noun Number'],
		avg_divisor: 'present_flags',
		trigger_grouper: t => `${t.flags[0].encoding_anchor['noun_index']}-${t.flags[0].value}`
	},
	{
		name: 'Modifier Degree',
		flags: ['Modifier Degree'],
		avg_divisor: 'present_flags',
		trigger_grouper: t => `${t.flags[0].encoding_anchor['concept']}-${t.flags[0].value}`
	},
	{
		name: 'Social Dynamic',
		flags: ['Speaker', 'Listener', 'Speaker Attitude'],
		avg_divisor: 'possible_flags',
		trigger_grouper: t => t.flags.map(f => `${f.name}-${f.value}`).join(';')
	},
	{
		name: 'Intent/Result',
		flags: ['Intent/Result'],
		avg_divisor: 'present_flags',
		trigger_grouper: t => `${t.flags[0].encoding_anchor['event'] || ''}-${t.flags[0].value}`
	},
	{
		name: 'Means/Reason',
		flags: ['Means/Reason'],
		avg_divisor: 'present_flags',
		trigger_grouper: t => `${t.flags[0].encoding_anchor['means_or_reason'] || ''}-${t.flags[0].value}`
	},
	{
		name: 'Explanation of Name',
		flags: ['Explanation of Name'],
		avg_divisor: 'present_flags',
		trigger_grouper: t => t.flags[0].value
	},
	{
		name: 'Metonymy',
		flags: ['Metonymy'],
		avg_divisor: 'present_flags',
		trigger_grouper: t => t.flags[0].value
	},
	{
		name: 'Metaphor',
		flags: ['Metaphor'],
		avg_divisor: 'present_flags',
		trigger_grouper: t => `${t.flags[0].encoding_anchor['subject']}->${t.flags[0].encoding_anchor['state']}`
	},
	{
		name: 'Optional Agent of Passive',
		flags: ['Optional Agent of Passive'],
		avg_divisor: 'present_flags',
		trigger_grouper: t => `${t.flags[0].encoding_anchor['verb']} by ${t.flags[0].encoding_anchor['agent']}`
	},
]

export function collect_triggers(flags: CopilotWeightedFlag[]): TriggerData[] {
	return triggers.flatMap(trigger => apply_trigger(trigger, flags))
}

function apply_trigger(trigger: TriggerTemplate, flags: CopilotWeightedFlag[]): TriggerData[] {
	const trigger_flags = flags.filter(f => trigger.flags.includes(f.name))
	const grouped = Map.groupBy(trigger_flags, t => t.encoding_anchor['node_id'])

	const triggers: TriggerData[] = []
	for (const flags of grouped.values()) {
		const avg_divisor = trigger.avg_divisor === 'possible_flags' ? trigger.flags.length : flags.length
		const avg_weight = flags.map(f => f.weight).reduce((acc, w) => acc + w, 0.0) / avg_divisor
		triggers.push({
			name: trigger.name,
			node_id: flags[0].encoding_anchor.node_id,
			flags,
			weight: avg_weight,
		})
	}
	if (trigger.trigger_grouper) {
		// just return the first trigger within a group
		return [...Map.groupBy(triggers, trigger.trigger_grouper).values()].map(trigger_group => trigger_group[0])
	}
	return triggers
}