# Editor web app

Available at [https://editor.tabitha.bible](https://editor.tabitha.bible)

## API

### 1. Grammar & Rule Checker API

- `GET /check?text={text}` — Parses input encoding text, checks rule validations, performs backtranslation, and returns overall status (`ok` | `warning` | `error`), tokens with messages, and backtranslation.
  - **Query Params:** `text` (`string`, required) — Raw encoding text to check.
  - **Example:** `/check?text=Paul+write-01`

### 2. Text Analysis API

- `GET /analyze?text={text}` — Parses input text into sentences and performs semantic analysis to extract source entities and features.
  - **Query Params:** `text` (`string`, required) — Raw text or encoding.
  - **Example:** `/analyze?text=Paul+write-01`

### 3. AI Assist Generation API

- `POST /ai-assist/generate` — Generates AI completions for semantic encoding assistance using fine-tuned models.
  - **Request Body:**

    ```json
    {
      "message": "User prompt or encoding context",
      "temperature": 0.7,
      "frequency_penalty": 0,
      "presence_penalty": 0
    }
    ```

  - **Response:** `{ "finish_reason": "stop", "message": "Generated response..." }`

## Local development

`pnpm i`

## Running locally

```bash
pnpm dev
```

## Static analysis

```bash
pnpm check
```

## Testing locally

### Unit tests

```bash
pnpm test:unit
```

### Coverage

```bash
pnpm test:unit:coverage
```

## Building

Creates a production version of the app:

```bash
pnpm build
```

## Contributing

Always start your work in a new branch.

Run the following command as a last check before opening a PR

```bash
pnpm precommit
```
