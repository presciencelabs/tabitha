import { AiResponseError } from './errors'
import type { AiCallDefaults, AiClient, AiGatewayConfig, CreateAiClientOptions, GenerateJsonParams, GenerateTextParams } from './types'

// Fixed for every call site -- not overridable. For more info, see the type comments in types.ts.
const FIXED_MODEL = 'gemini-3.5-flash'
const FIXED_SEED = 42 // 😏
const GATEWAY_NAME = 'tabitha'
// Vertex AI's REST API version the gateway forwards to -- matches what @google/genai's SDK sent
// by default (its internal VERTEX_AI_API_DEFAULT_VERSION), kept in sync now that this package
// builds the request by hand instead of going through that SDK.
const VERTEX_API_VERSION = 'v1beta1'

const PACKAGE_DEFAULTS: AiCallDefaults = {
	temperature: 0.0,
	frequencyPenalty: 0.0,
	presencePenalty: 0.0,
}

type VertexGenerateContentResponse = {
	candidates?: { content?: { parts?: { text?: string, thought?: boolean }[] } }[]
}

export function create_ai_client({ app, feature, gateway, defaults }: CreateAiClientOptions): AiClient {
	const url = build_url(gateway)

	async function call(contents: unknown, system_instruction: string | undefined, config: AiCallDefaults): Promise<string> {
		// `httpOptions` is a per-call escape hatch (e.g. ontology's AI-Gateway cache-TTL header) --
		// it's HTTP transport config, not a Vertex generationConfig field, so it's pulled out here
		// rather than forwarded into the request body.
		const { httpOptions, ...generation_config } = config as AiCallDefaults & { httpOptions?: { headers?: Record<string, string> } }

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				'cf-aig-authorization': `Bearer ${gateway.token}`,
				'cf-aig-metadata': JSON.stringify({ app, feature }),
				...httpOptions?.headers,
			},
			body: JSON.stringify({
				contents: [{ role: 'user', parts: [{ text: JSON.stringify(contents) }] }],
				...(system_instruction ? { systemInstruction: { role: 'user', parts: [{ text: system_instruction }] } } : {}),
				generationConfig: { ...generation_config, seed: FIXED_SEED },
			}),
		})

		if (!response.ok) {
			throw new Error(`AI Gateway request failed with status ${response.status} (app "${app}", feature "${feature}"): ${await response.text()}`)
		}

		const text = extract_text(await response.json() as VertexGenerateContentResponse)
		if (!text) {
			throw new AiResponseError(`Empty response from model "${FIXED_MODEL}" (app "${app}", feature "${feature}")`)
		}

		return text
	}

	function resolve_config(overrides?: AiCallDefaults): AiCallDefaults {
		return merge_defaults(PACKAGE_DEFAULTS, defaults, overrides)
	}

	async function generate_json<T>(params: GenerateJsonParams): Promise<T> {
		const text = await call(params.contents, params.system_instruction, {
			...resolve_config(params.config),
			responseMimeType: 'application/json',
			responseJsonSchema: params.schema,
		})

		try {
			return JSON.parse(text) as T
		} catch (cause) {
			throw new AiResponseError(`Failed to parse JSON response from model "${FIXED_MODEL}" (app "${app}", feature "${feature}")`, { cause })
		}
	}

	async function generate_text(params: GenerateTextParams): Promise<string> {
		return call(params.contents, params.system_instruction, resolve_config(params.config))
	}

	return { generate_json, generate_text }
}

function merge_defaults(...layers: (AiCallDefaults | undefined)[]): AiCallDefaults {
	return Object.assign({}, ...layers.filter((layer): layer is AiCallDefaults => Boolean(layer)))
}

/**
 * Same route + resource path @google/genai's SDK builds for `vertexai: true` with a
 * `httpOptions.baseUrl` override: `{baseUrl}/{apiVersion}/projects/{project}/locations/{location}/
 * publishers/google/models/{model}:generateContent`. Traced directly from the SDK's own
 * `ApiClient.constructUrl`/`shouldPrependVertexProjectPath` and `tModel` so this hand-rolled
 * request matches what was previously sent, byte for byte.
 */
function build_url(gateway: AiGatewayConfig): string {
	return `https://gateway.ai.cloudflare.com/v1/${gateway.account_id}/${GATEWAY_NAME}/google-vertex-ai/${VERTEX_API_VERSION}`
		+ `/projects/${encodeURIComponent(gateway.project)}/locations/${encodeURIComponent(gateway.location)}`
		+ `/publishers/google/models/${FIXED_MODEL}:generateContent`
}

function extract_text(response: VertexGenerateContentResponse): string {
	const parts = response.candidates?.[0]?.content?.parts ?? []
	return parts
		.filter((part): part is { text: string, thought?: boolean } => typeof part.text === 'string' && !part.thought)
		.map(part => part.text)
		.join('')
}
