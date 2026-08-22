import { GoogleGenAI, type GenerateContentConfig } from '@google/genai'
import { AiResponseError } from './errors'
import type { AiCallDefaults, AiClient, AiGatewayConfig, CreateAiClientOptions, GenerateJsonParams, GenerateTextParams } from './types'

const DEFAULT_MODEL = 'gemini-3.5-flash'

const PACKAGE_DEFAULTS: AiCallDefaults = {
	temperature: 0.0,
	seed: 42,
	frequencyPenalty: 0.0,
	presencePenalty: 0.0,
}

export function create_ai_client({ app, feature, gateway, defaults }: CreateAiClientOptions): AiClient {
	const genai = create_genai_client(gateway, { app, feature })

	function resolve_config(overrides?: AiCallDefaults): { model: string, config: Partial<GenerateContentConfig> } {
		const { model, ...config } = merge_defaults(PACKAGE_DEFAULTS, defaults, overrides)
		return { model: model ?? DEFAULT_MODEL, config }
	}

	async function generate_json<T>(params: GenerateJsonParams): Promise<T> {
		const { model, config } = resolve_config(params.config)

		const response = await genai.models.generateContent({
			model,
			contents: JSON.stringify(params.contents),
			config: {
				...config,
				systemInstruction: params.system_instruction ?? config.systemInstruction,
				responseMimeType: 'application/json',
				responseJsonSchema: params.schema,
			},
		})

		if (!response.text) {
			throw new AiResponseError(`Empty response from model "${model}" (app "${app}", feature "${feature}")`)
		}

		try {
			return JSON.parse(response.text) as T
		} catch (cause) {
			throw new AiResponseError(`Failed to parse JSON response from model "${model}" (app "${app}", feature "${feature}")`, { cause })
		}
	}

	async function generate_text(params: GenerateTextParams): Promise<string> {
		const { model, config } = resolve_config(params.config)

		const response = await genai.models.generateContent({
			model,
			contents: JSON.stringify(params.contents),
			config: {
				...config,
				systemInstruction: params.system_instruction ?? config.systemInstruction,
			},
		})

		if (!response.text) {
			throw new AiResponseError(`Empty response from model "${model}" (app "${app}", feature "${feature}")`)
		}

		return response.text
	}

	return { generate_json, generate_text }
}

function merge_defaults(...layers: (AiCallDefaults | undefined)[]): AiCallDefaults {
	return Object.assign({}, ...layers.filter((layer): layer is AiCallDefaults => Boolean(layer)))
}

/**
 * BYOK means the gateway injects the real Google credentials -- the client should send only
 * `cf-aig-authorization`. But the SDK's own auth layer falls back to resolving real Google
 * Application Default Credentials whenever `apiKey` is left unset, which would fail outside a
 * GCP environment (e.g. in a Cloudflare Worker). Passing the gateway token as `apiKey` avoids
 * that; traced through the SDK's precedence logic and confirmed it does not change the request
 * body or URL (project/location still drive those), only which auth header gets attached -- it
 * adds an extra `x-goog-api-key` header the gateway doesn't need. Unconfirmed whether Cloudflare's
 * Vertex+BYOK route tolerates that extra header or rejects it -- verify against a real
 * BYOK-configured gateway during Phase 3 migration before relying on it in production.
 */
function create_genai_client(gateway: AiGatewayConfig, metadata: { app: string, feature: string }): GoogleGenAI {
	return new GoogleGenAI({
		apiKey: gateway.token,
		vertexai: true,
		project: gateway.project,
		location: gateway.location,
		httpOptions: {
			baseUrl: `https://gateway.ai.cloudflare.com/v1/${gateway.account_id}/${gateway.gateway_name}/google-vertex-ai`,
			headers: {
				'cf-aig-authorization': `Bearer ${gateway.token}`,
				'cf-aig-metadata': JSON.stringify(metadata),
			},
		},
	})
}
