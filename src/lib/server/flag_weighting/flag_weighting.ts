import default_flag_weights from './default_flag_weights.json' with { type: 'json' }

type FlagWeightingMap = Record<string, Record<string, number>>

export function assign_flag_weights(flags: CopilotTriggerFlag[], language_profile: LanguageProfile): CopilotWeightedFlag[] {
	const profile_weights = get_profile_weights(language_profile)
	return flags.map(flag => assign_flag_weight(flag, profile_weights))
}

function assign_flag_weight(flag: CopilotTriggerFlag, profile_weights: FlagWeightingMap): CopilotWeightedFlag {
	const weight = get_flag_weight(flag, profile_weights) ?? get_flag_weight(flag, default_flag_weights) ?? 0
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
		weights['Optional Agent of Passive'] = {
			'person-A': 1,
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
		weights['Speaker'] = {
			'King': 5,
			'God': 1,
			'Man': 1,
		}
		weights['Listener'] = {
			'God': 2,
			'Man': 1,
			'Crowd': 3,
		}
		weights['Speaker Attitude'] = {
			'Anger': 4,
		}
	}
	if (profile.closing_quotation_frame) {
		weights['Opening Quotation Frame'] = {
			'*': 0.5,
		}
		weights['Closing Quotation Frame'] = {
			'*': 1,
		}
	}

	return weights
}