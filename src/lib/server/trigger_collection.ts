
type TriggerTemplate = {
	name: string
	flags: string[]
	weight_calculator: (flags: CopilotWeightedFlag[]) => number
	flag_grouper?: (flag: CopilotWeightedFlag) => string
	trigger_grouper?: (trigger: TriggerData) => string
	prompt?: string | ((flags: CopilotWeightedFlag[]) => string)
}

type TriggerData = {
	trigger_id?: number
	name: string
	node_id: string
	flags: CopilotWeightedFlag[]
	weight: number
	prompt?: string
}

const triggers: TriggerTemplate[] = [
	{
		name: 'TAMP',
		flags: ['Verb Time', 'Verb Aspect', 'Verb Mood', 'Verb Polarity'],
		weight_calculator: power_sum,
	},
	{
		name: 'Noun Person and Number',
		flags: ['Noun Person', 'Noun Number'],
		weight_calculator: flags => Math.max(...flags.map(f => f.weight)),
		trigger_grouper: t => `${t.flags[0].encoding_anchor['noun_index']}-${t.flags.map(({ value }) => value).join('-')}`,
		prompt: flags => {
			const person = flags.find(f => f.name === 'Noun Person')?.value
			if (person === 'First Inclusive') {
				return `First Inclusive means that the reader/listener is included when the writer/speaker says "we/us".
					DO NOT say "if your language has an inclusive/exclusive distinction".`
			} else if (person === 'First Exclusive') {
				return `First Exclusive means that the reader/listener is NOT included when the writer/speaker says "we/us".
					DO NOT say "if your language has an inclusive/exclusive distinction".`
			}
			return ''
		},
	},
	{
		name: 'Modifier Degree',
		flags: ['Modifier Degree'],
		weight_calculator: flags => flags[0].weight,
		trigger_grouper: t => `${t.flags[0].encoding_anchor['concept']}-${t.flags[0].value}`,
	},
	{
		name: 'Social Dynamic',
		flags: ['Speaker', 'Listener', 'Speaker Attitude'],
		// TODO The weights should be more about the speaker-listener pair
		weight_calculator: power_sum,
		trigger_grouper: t => t.flags.map(f => `${f.name}-${f.value}`).join(';'),
	},
	{
		name: 'Intent/Result',
		flags: ['Intent/Result'],
		weight_calculator: flags => flags[0].weight,
		trigger_grouper: t => `${t.flags[0].encoding_anchor['event'] || ''}-${t.flags[0].value}`,
	},
	{
		name: 'Means/Reason',
		flags: ['Means/Reason'],
		weight_calculator: flags => flags[0].weight,
		trigger_grouper: t => `${t.flags[0].encoding_anchor['means_or_reason'] || ''}-${t.flags[0].value}`,
	},
	{
		name: 'Explanation of Name',
		flags: ['Explanation of Name'],
		weight_calculator: flags => flags[0].weight,
		trigger_grouper: t => t.flags[0].value,
		prompt: `For the meaning, write something like "This is the first time {proper_name} is mentioned in this book, and {proper_name} is a {label}.
		For the check, write something like "Consider making this clear in your translation or include a footnote."`,
	},
	{
		name: 'Metonymy',
		flags: ['Metonymy'],
		weight_calculator: flags => flags[0].weight,
		trigger_grouper: t => t.flags[0].value,
		prompt: flags => {
			const meaning_prompt = flags[0].encoding_anchor['metonymy_type']?.startsWith('Dynamic')
				? 'For the meaning, explain that the original text simply contains {whole}, but can be understood as {part} {whole}.'
				: 'For the meaning, explain that the original text contains {part} {whole}, but can be understood simply as {whole}.'
			return `${meaning_prompt} For the check, write something like "Consider which way is clearer in your language."`
		},
	},
	{
		name: 'Metaphor',
		flags: ['Metaphor'],
		weight_calculator: flags => flags[0].weight,
		trigger_grouper: t => `${t.flags[0].encoding_anchor['subject']}->${t.flags[0].encoding_anchor['state']}`,
	},
	{
		name: 'Optional Agent of Passive',
		flags: ['Optional Agent of Passive'],
		weight_calculator: flags => flags[0].weight,
		trigger_grouper: t => `${t.flags[0].encoding_anchor['verb']} by ${t.flags[0].encoding_anchor['agent']}`,
		prompt: `For the meaning, write something like "The original text did not include the one doing {verb}, but it is likely {agent}".
		For the check, write something like "Consider including {agent} as the one doing {verb} if your language needs it."`,
	},
	{
		name: 'Closing Quotation Frame',
		flags: ['Opening Quotation Frame', 'Closing Quotation Frame'],
		weight_calculator: flags => {
			const closing = flags.find(f => f.name.startsWith('Closing'))
			return closing && flags.length === 1 ? closing.weight : 0
		},
		flag_grouper: f => f.value,
		prompt: 'Write a reminder about who was speaking and listening.',
	},
]

export function collect_triggers(flags: CopilotWeightedFlag[]): TriggerData[] {
	return triggers.flatMap(trigger => apply_trigger(trigger, flags))
}

function apply_trigger(trigger: TriggerTemplate, flags: CopilotWeightedFlag[]): TriggerData[] {
	const trigger_flags = flags.filter(f => trigger.flags.includes(f.name))
	const grouper: (flag: CopilotWeightedFlag) => string = trigger.flag_grouper || (f => f.encoding_anchor['node_id'])
	const grouped = Map.groupBy(trigger_flags, grouper)

	const triggers: TriggerData[] = []
	for (const flags of grouped.values()) {
		const weight = trigger.weight_calculator(flags)
		// const avg_divisor = trigger.avg_divisor === 'possible_flags' ? trigger.flags.length : flags.length
		// const avg_weight = flags.map(f => f.weight).reduce((acc, w) => acc + w, 0.0) / avg_divisor
		const trigger_data: TriggerData = {
			name: trigger.name,
			node_id: flags[0].encoding_anchor.node_id,
			flags,
			weight,
		}
		if (trigger.prompt) {
			trigger_data.prompt = typeof trigger.prompt === 'string' ? trigger.prompt : trigger.prompt(flags)
		}
		triggers.push(trigger_data)
	}
	if (trigger.trigger_grouper) {
		// just return the first trigger within a group
		return [...Map.groupBy(triggers, trigger.trigger_grouper).values()].map(trigger_group => trigger_group[0])
	}
	return triggers
}

function power_sum(flags: CopilotWeightedFlag[]): number {
	const pow = 2
	const pow_sum = flags.reduce((sum, flag) => sum + Math.pow(flag.weight, pow), 0)
	const pow_avg = Math.pow(pow_sum, 1 / pow)
	const rounded = Math.round(pow_avg)
	return Math.min(5, rounded)
}