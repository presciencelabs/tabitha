class NetworkState {
	is_offline = $state(false)

	initialize() {
		if (typeof window === 'undefined') return
		this.is_offline = !navigator.onLine

		window.addEventListener('offline', () => {
			this.is_offline = true
			console.info('network status: offline')
		})

		window.addEventListener('online', () => {
			this.is_offline = false
			console.info('network status: online')
		})

		console.info('network detection initialized, status:', this.is_offline ? 'offline' : 'online')
	}
}

export const network_state = new NetworkState()
