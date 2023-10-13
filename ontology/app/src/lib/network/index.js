// https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine
import Status from './Status.svelte'
import {writable} from 'svelte/store'

/** @type {import('svelte/store').Writable<boolean>} */
let offline

function initialize_detection() {
	offline = writable(!navigator.onLine)

	window.addEventListener('offline', () => offline.set(true))
	window.addEventListener('online', () => offline.set(false))

	console.info('network detection initialized')

	offline.subscribe(value => console.info('network status: ', value ? 'offline' : 'online'))
}

// prettier-ignore
export {
	Status,
	initialize_detection,
	offline,
}
