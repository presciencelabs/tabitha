# Editor Web App

- **Live URL**: [https://editor.tabitha.bible](https://editor.tabitha.bible)
- **Local Dev URL**: [http://localhost.tabitha.bible:8790](http://localhost.tabitha.bible:8790) (Port `8790`)

---

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

---

## Local Development

From the **monorepo root**:
```bash
# Run Editor dev server only
pnpm dev:editor

# Or run all apps concurrently
pnpm dev
```

Or from within `apps/editor`:
```bash
pnpm dev
```

---

## Testing & Verification

```bash
# Run typechecking and linting
pnpm check

# Run unit tests
pnpm test:unit

# Build for Cloudflare
pnpm build
```
