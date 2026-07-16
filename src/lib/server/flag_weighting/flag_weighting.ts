import { default_flag_weights_for_discern, default_flag_weights_for_brief } from './default_flag_weights'

type FlagWeightingMap = Record<string, Record<string, number>>

export function assign_flag_weights(flags: CopilotTriggerFlag[], settings: CopilotNoteSettings): CopilotWeightedFlag[] {
	const default_weights = settings.mode === 'discern' ? default_flag_weights_for_discern : default_flag_weights_for_brief
	const profile_weights = get_profile_weights(settings.language_profile)
	return flags.map(flag => assign_flag_weight(flag, profile_weights, default_weights))
}

function assign_flag_weight(flag: CopilotTriggerFlag, profile_weights: FlagWeightingMap, default_weights: FlagWeightingMap): CopilotWeightedFlag {
	const weight = get_flag_weight(flag, profile_weights) ?? get_flag_weight(flag, default_weights) ?? 0
	return { ...flag, weight }
}

function get_flag_weight(flag: CopilotTriggerFlag, weights: FlagWeightingMap): number | undefined {
	const flag_weights = weights[flag.name]
	if (!flag_weights) {
		return undefined
	}
	const weight = flag_weights[flag.value]
	return weight !== undefined ? weight : flag_weights['*']
}

function get_profile_weights(profile: LanguageProfile): FlagWeightingMap {
	const weights: FlagWeightingMap = {}

	if (profile.clusivity) {
		weights['Noun Person'] = {
			'First Inclusive': 3,
			'First Exclusive': 5,
		}
	}
	if (!profile.passive) {
		weights['Agent of Passive'] = {
			'person-A': 1,
			'God-A': 1,
			'Yahweh-A': 1,
			'*': 5,
		}
	}
	if (profile.dual || profile.trial) {
		weights['Noun Number'] = {
			'Dual': profile.dual ? 5 : 0,
			'Trial': profile.trial ? 5 : 0,
		}
	}
	if (profile.honorifics) {
		// TODO let the profile pick the Speaker and Listener values it cares about
		weights['Speaker'] = {
			'King': 5,
			'God': 0,
			'Man': 1,
			'*': 3,
		}
		weights['Listener'] = {
			'God': 0,
			'Man': 1,
			'Crowd': 2,
			'*': 3,
		}
		weights['Speaker Attitude'] = {
			'Anger': 4,
		}
		weights['Speaker-Listener Age'] = {
			'Older - Different Generation': 5,
			'Older - Same Generation': 4,
			'Essentially the Same Age': 3,
			'Younger - Different Generation': 4,
			'Younger - Same Generation': 5,
		}
	}
	if (!profile.rhetorical_questions) {
		weights['Rhetorical Question'] = {
			'Equivalent Statement': 5,
		}
	}
	if (profile.closing_quotation_frame) {
		weights['Opening Quotation Frame'] = {
			'*': 1,
		}
		weights['Closing Quotation Frame'] = {
			'*': 5,
		}
	}

	return weights
}