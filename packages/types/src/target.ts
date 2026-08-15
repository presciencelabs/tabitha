import type { DbFeature } from './source'

export type TargetTextResult = {
	text: string
	audience: string
	ideal?: string
}

export type TargetApiFeature = DbFeature

export type TargetApiFeatureResult = {
	source: TargetApiFeature[]
	lexical: TargetApiFeature[]
}

export type FormName = {
	form_name: string
	category: string
	features: string
}

export type LexicalForm = {
	stem: string
	form: string
	form_name: string
	category: string
}
