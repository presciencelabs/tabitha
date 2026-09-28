import { describe, expect, test, vi } from 'vitest'
import { read_ndjson_stream } from './ndjson'

function stream_of(...chunks: string[]): ReadableStream<Uint8Array> {
	const encoder = new TextEncoder()
	return new ReadableStream({
		start(controller) {
			chunks.forEach(chunk => controller.enqueue(encoder.encode(chunk)))
			controller.close()
		},
	})
}

async function read_all(...chunks: string[]): Promise<unknown[]> {
	const items: unknown[] = []
	await read_ndjson_stream({ body: stream_of(...chunks), on_items: next => items.push(...next) })
	return items
}

describe('read_ndjson_stream', () => {
	test('parses one item per line', async () => {
		expect(await read_all('{"a":1}\n{"a":2}\n')).toEqual([{ a: 1 }, { a: 2 }])
	})

	test('reassembles a line split across chunks', async () => {
		expect(await read_all('{"a":', '1}\n{"a"', ':2}\n')).toEqual([{ a: 1 }, { a: 2 }])
	})

	test('parses a final line with no trailing newline', async () => {
		expect(await read_all('{"a":1}\n{"a":2}')).toEqual([{ a: 1 }, { a: 2 }])
	})

	test('ignores blank lines', async () => {
		expect(await read_all('{"a":1}\n\n{"a":2}\n\n')).toEqual([{ a: 1 }, { a: 2 }])
	})

	test('warns about, rather than throws on, an unparseable final fragment', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

		expect(await read_all('{"a":1}\n{"a":')).toEqual([{ a: 1 }])
		expect(warn).toHaveBeenCalledOnce()
	})
})
