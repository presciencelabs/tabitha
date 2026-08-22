import type { GenerateContentConfig } from '@google/genai'

/**
 * Config for the shared Cloudflare AI Gateway, routed exclusively through Google Vertex AI
 * (never plain Google AI Studio) -- Vertex is a hard requirement for global-deployment/
 * data-residency needs, not something app-by-app choice should be allowed to drop. `project`
 * and `location` are Vertex's own required routing fields; `location` can't be `'global'` --
 * Cloudflare's Universal Endpoint docs warn that has limited model support. Owned entirely by
 * the package -- never overridable per call.
 */
export type AiGatewayConfig = {
	account_id: string
	gateway_name: string
	token: string
	project: string
	location: string
}

/** Generation behavior. Everything here is overridable at the client-defaults or per-call layer. */
export type AiCallDefaults = Partial<GenerateContentConfig> & {
	model?: string
}

export type CreateAiClientOptions = {
	app: string
	feature: string
	gateway: AiGatewayConfig
	defaults?: AiCallDefaults
}

export type GenerateJsonParams = {
	contents: unknown
	system_instruction?: string
	schema: object
	config?: AiCallDefaults
}

export type GenerateTextParams = {
	contents: unknown
	system_instruction?: string
	config?: AiCallDefaults
}

export type AiClient = {
	generate_json<T>(params: GenerateJsonParams): Promise<T>
	generate_text(params: GenerateTextParams): Promise<string>
}
