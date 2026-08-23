import type { ConceptCreateData, ConceptUpdateData } from '$lib/server/types'
import type { OntologyChangeAction } from '$lib/types'

const DB_NAME = 'tabitha-ontology-offline-queue'
const DB_VERSION = 1
const STORE_NAME = 'mutations'

export type QueuedMutationStatus = 'pending' | 'syncing' | 'failed'

export type QueuedMutation = {
	client_id: string
	action: OntologyChangeAction
	body: ConceptCreateData | ConceptUpdateData
	status: QueuedMutationStatus
	failure_reason?: string
	retry_count: number
}

function open_db(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION)
		request.onupgradeneeded = () => {
			request.result.createObjectStore(STORE_NAME, { keyPath: 'client_id' })
		}
		request.onsuccess = () => resolve(request.result)
		request.onerror = () => reject(request.error)
	})
}

async function with_store<T = undefined>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
	const db = await open_db()
	return new Promise((resolve, reject) => {
		const request = fn(db.transaction(STORE_NAME, mode).objectStore(STORE_NAME))
		request.onsuccess = () => resolve(request.result)
		request.onerror = () => reject(request.error)
	})
}

// crypto.randomUUID() requires a secure context (https, or the literal hostname "localhost") --
// local dev serves over http on a custom hostname, so fall back to building one manually from
// crypto.getRandomValues(), which isn't secure-context-gated.
function generate_client_id(): string {
	if (typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID()
	}
	const bytes = crypto.getRandomValues(new Uint8Array(16))
	bytes[6] = bytes[6] & 0x0f | 0x40 // version 4
	bytes[8] = bytes[8] & 0x3f | 0x80 // variant 10
	const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('')
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export async function add_mutation(action: OntologyChangeAction, body: ConceptCreateData | ConceptUpdateData): Promise<QueuedMutation> {
	const mutation: QueuedMutation = {
		client_id: generate_client_id(),
		action,
		body,
		status: 'pending',
		retry_count: 0,
	}
	await with_store('readwrite', store => store.add(mutation))
	return mutation
}

export async function get_pending_mutations(): Promise<QueuedMutation[]> {
	const all = await with_store<QueuedMutation[]>('readonly', store => store.getAll())
	return all.filter(mutation => mutation.status === 'pending')
}

export async function update_mutation(client_id: string, changes: Partial<QueuedMutation>): Promise<void> {
	const db = await open_db()
	await new Promise<void>((resolve, reject) => {
		const store = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME)
		const get_request = store.get(client_id) as IDBRequest<QueuedMutation | undefined>
		get_request.onsuccess = () => {
			const existing = get_request.result
			if (!existing) {
				resolve()
				return
			}
			const put_request = store.put({ ...existing, ...changes })
			put_request.onsuccess = () => resolve()
			put_request.onerror = () => reject(put_request.error)
		}
		get_request.onerror = () => reject(get_request.error)
	})
}

export async function delete_mutation(client_id: string): Promise<void> {
	await with_store('readwrite', store => store.delete(client_id))
}
