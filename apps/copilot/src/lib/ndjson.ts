// NDJSON = newline-delimited JSON (also called JSON Lines): one complete JSON value per line,
// streamed with the application/x-ndjson media type. Spec: https://github.com/ndjson/ndjson-spec
type ReadNdjsonOptions<T> = {
	body: ReadableStream<Uint8Array>
	on_items: (items: T[]) => void
}

export async function read_ndjson_stream<T>({ body, on_items }: ReadNdjsonOptions<T>): Promise<void> {
	const reader = body.getReader()
	const decoder = new TextDecoder()

	let buffer = ''

	while (true) {
		const { done, value } = await reader.read()
		if (done) break

		buffer += decoder.decode(value, { stream: true })

		const lines = buffer.split('\n')

		// Keep the last (possibly incomplete) line for the next chunk
		buffer = lines.pop() ?? ''

		const items = lines.filter(line => line.trim()).map(line => JSON.parse(line) as T)
		if (items.length) on_items(items)
	}

	if (!buffer.trim()) return

	try {
		on_items([JSON.parse(buffer) as T])
	} catch {
		console.warn(`Leftover piece from streaming: "${buffer}"`)
	}
}
