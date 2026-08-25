/**
 * Thrown for any failure to get a usable response out of the model -- an empty response or a
 * response that doesn't parse as the requested JSON schema. Replaces the four divergent
 * hand-rolled failure modes the individual call sites had before this package existed.
 */
export class AiResponseError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options)
		this.name = 'AiResponseError'
	}
}
