---
name: google-genai
description: Google GenAI SDK (@google/genai) and Gemini model development skill. TRIGGER when writing, inspecting, or configuring AI copilot features, prompt templates, structured output schemas, context caching, or Gemini API integrations in apps/copilot or shared packages.
metadata:
  version: 2.x
---

# Google GenAI SDK (@google/genai) Best Practices

Guidelines for developing AI-assisted translation features and LLM pipelines using `@google/genai` and Gemini models in TaBiThA.

---

## 1. Client Initialization & Models

Initialize the `GoogleGenAI` client using environment variables:

```typescript
import { GoogleGenAI, Type } from '@google/genai'

const ai = new GoogleGenAI({
	apiKey: env.GEMINI_API_KEY || process.env.GEMINI_API_KEY,
})

// Recommended models:
// - gemini-2.5-flash: Fast, high-throughput translation analysis & token checking
// - gemini-2.5-pro: Deep semantic reasoning, complex grammatical rule synthesis
const MODEL_NAME = 'gemini-2.5-flash'
```

---

## 2. Structured JSON Outputs with `responseSchema`

Always enforce strict JSON schemas for predictable programmatic parsing:

```typescript
const response = await ai.models.generateContent({
	model: 'gemini-2.5-flash',
	contents: prompt_text,
	config: {
		responseMimeType: 'application/json',
		responseSchema: {
			type: Type.OBJECT,
			properties: {
				analysis: { type: Type.STRING },
				flags: {
					type: Type.ARRAY,
					items: {
						type: Type.OBJECT,
						properties: {
							term: { type: Type.STRING },
							category: { type: Type.STRING },
							suggestion: { type: Type.STRING },
						},
						required: ['term', 'suggestion'],
					},
				},
				confidence: { type: Type.NUMBER },
			},
			required: ['analysis', 'flags'],
		},
		systemInstruction: 'You are an expert biblical linguist and TBTA translation assistant.',
		temperature: 0.2,
	},
})

const result = JSON.parse(response.text || '{}')
```

---

## 3. Streaming Responses

For real-time interactive feedback in the UI:

```typescript
const stream = await ai.models.generateContentStream({
	model: 'gemini-2.5-flash',
	contents: prompt,
	config: { systemInstruction: 'Draft translation notes concisely.' },
})

for await (const chunk of stream) {
	if (chunk.text) {
		yield chunk.text
	}
}
```

---

## 4. Context & Prompt Caching

For large, repetitive context like TBTA grammar manuals or full ontology dictionaries:
- Utilize Gemini Context Caching when passing static linguistic reference datasets (>32k tokens) to minimize latency and token costs across multiple queries.
