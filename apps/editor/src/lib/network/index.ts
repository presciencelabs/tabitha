// https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine
import Status from './Status.svelte'
import { writable, type Writable } from 'svelte/store'

let offline: Writable<boolean>

function initialize_detection() {
	offline = writable(!navigator.onLine)

	window.addEventListener('offline', () => offline.set(true))
	window.addEventListener('online', () => offline.set(false))

	console.info('network detection initialized')

	offline.subscribe(value => console.info('network status: ', value ? 'offline' : 'online'))
}

export {
	Status,
	initialize_detection,
	offline,
}
