import { getContext, setContext } from 'svelte'
import english from '../../messages/en.json'

// The catalog in ../../messages is merged into each i18n-enabled app's own Paraglide
// project, so the app's compiled `m` already satisfies this shape and can be passed as-is.
type UiMessageKey = Exclude<keyof typeof english, '$schema'>
export type UiMessages = Record<UiMessageKey, () => string>

const UI_MESSAGES_KEY = Symbol('ui_messages')

const english_ui_messages = Object.fromEntries(
	Object.entries(english)
		.filter(([key]) => key !== '$schema')
		.map(([key, text]) => [key, () => text]),
) as UiMessages

export function set_ui_messages(messages: UiMessages) {
	setContext(UI_MESSAGES_KEY, messages)
}

export function get_ui_messages(): UiMessages {
	return getContext<UiMessages | undefined>(UI_MESSAGES_KEY) ?? english_ui_messages
}
