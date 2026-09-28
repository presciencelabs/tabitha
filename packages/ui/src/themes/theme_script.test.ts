import { describe, expect, it } from 'vitest'
import { theme_script } from './theme_script'

type ThemeScriptRun = {
	readonly get_item: () => string | null
}

const run_theme_script = ({ get_item }: ThemeScriptRun): string | undefined => {
	const html = { dataset: {} as Record<string, string> }
	new Function('localStorage', 'document', theme_script)({ getItem: get_item }, { documentElement: html })
	return html.dataset.theme
}

describe('theme_script', () => {
	it('applies a saved theme', () => {
		expect(run_theme_script({ get_item: () => 'dark' })).toBe('dark')
	})

	it('maps a saved display name to its daisyUI theme name', () => {
		expect(run_theme_script({ get_item: () => 'reformation' })).toBe('halloween')
		expect(run_theme_script({ get_item: () => 'CanIL Dark' })).toBe('CanILDark')
	})

	it('leaves the page alone when nothing is saved', () => {
		expect(run_theme_script({ get_item: () => null })).toBeUndefined()
	})

	it('ignores a saved value that is not a known theme', () => {
		expect(run_theme_script({ get_item: () => 'not-a-theme' })).toBeUndefined()
		expect(run_theme_script({ get_item: () => 'constructor' })).toBeUndefined()
	})

	it('does not throw when storage is unavailable', () => {
		const blocked = () => {
			throw new Error('storage blocked')
		}
		expect(() => run_theme_script({ get_item: blocked })).not.toThrow()
	})
})
