# Editor Web App

- **Live URL**: [https://editor.tabitha.bible](https://editor.tabitha.bible)
- **Local Dev URL**: [http://localhost:1337](http://localhost:1337) (Port `1337`)

---

## 🔌 API

> **Scripted clients:** send a descriptive `User-Agent` (e.g. `my-project/0.1 (+https://github.com/me/my-project)`); Cloudflare rejects some default library User-Agents, such as Python's `urllib`, with a `403` (`error code: 1010`). Production allows 60 requests per minute per IP, so run a local editor (see `CONTRIBUTING.md`) for batch work.

### 1. Grammar & Rule Checker API

- `GET /check?text={text}` — Parses input encoding text, checks rule validations, performs backtranslation, and returns overall status (`ok` | `warning` | `error`), tokens with messages, and backtranslation.
  - **Query Params:** `text` (`string`, required) — Raw encoding text to check.
  - **Example:** `/check?text=Paul+write-01`

### 2. Text Analysis API

- `GET /analyze?text={text}` — Parses input text into sentences and performs semantic analysis to extract source entities and features.
  - **Query Params:** `text` (`string`, required) — Raw text or encoding.
  - **Example:** `/analyze?text=Paul+write-01`

### 3. AI Assist Generation API

- `POST /ai-assist/generate` — Uses the shared `@tabitha/ai` client, routed through the Cloudflare AI Gateway, to convert English text into a Phase 1 encoding suggestion, then validates it against editor's own checker (with one automatic repair pass if the checker finds errors). The prompt pairs the editor's own conventions (`system_instruction.md`) with an itemized Phase 1 rule set (`phase1_rules.md`); the repair pass keeps both and adds the checker's feedback, including the ontology's pairing/explication hints for any flagged word.
  - **Request Body:**

    ```json
    { "text": "as it is written in Isaiah the prophet: ..." }
    ```

  - **Response:**

    ```json
    { "status": "ok", "phase_1": "...", "notes": ["..."], "check": { "status": "ok", "tokens": [], "back_translation": "..." } }
    ```

  - Requires `AI_GATEWAY_TOKEN` (see `.env` / `.env.local`) — see [docs/decisions/0007-ai-consolidation.md](../../docs/decisions/0007-ai-consolidation.md).

---

## 💻 Local Development

From the **monorepo root**:

```bash
# Run Editor dev server only
bun run dev:editor

# Or run all apps concurrently
bun run dev
```

Or from within `apps/editor`:

```bash
bun run dev
```

---

## ✅ Testing & Verification

For unified monorepo testing, linting, and build verification commands, see [CONTRIBUTING.md](../../CONTRIBUTING.md) or run `bun run precommit`.
