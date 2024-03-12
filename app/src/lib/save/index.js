import { browser } from '$app/environment'
import SaveButton from './SaveButton.svelte'
import { writable } from 'svelte/store'

const saved = init()

/** @returns {import('svelte/store').Writable<string>} */
function init() {
	const store = writable('', set => {
		const value = browser && localStorage?.getItem('saved') || ''
		set(value)
	})

	const { subscribe, set, update } = store

	return {
		subscribe,
		set: value => {
			browser && localStorage.setItem('saved', value)
			set(value)
		},
		update,
	}
}

export {
	saved,
	SaveButton,
}