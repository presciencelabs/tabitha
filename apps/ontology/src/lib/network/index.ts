// https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine
import Status from './Status.svelte'
import { network_state } from './network.svelte'

export function initialize_detection(): void {
	network_state.initialize()
}

export { Status, network_state }
