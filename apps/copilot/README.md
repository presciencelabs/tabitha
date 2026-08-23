# Tabitha Copilot

- **Live URL**: [https://copilot.tabitha.bible](https://copilot.tabitha.bible)
- **Local Dev URL**: [http://localhost:8793](http://localhost:8793) (Port `8793`)

---

## 🔌 API

### 1. Verse Copilot Notes API

- `GET /[book]/[chapter]/[verse]` — Retrieves copilot notes, warnings, and translation suggestions for a specific verse.
  - **Path Params:** `book` (`string`), `chapter` (`integer`), `verse` (`integer`)
  - **Query Params:** `settings` (`string`, optional JSON string of `CopilotSettings` for language profile, sensitivity, etc.)
  - **Example:** `/Acts/10/9`

### 2. Chapter SFM Export API

- `GET /[book]/[chapter]` — Generates and downloads an SFM (Standard Format Marker) file containing copilot translation notes for an entire chapter.
  - **Path Params:** `book` (`string`), `chapter` (`integer`)
  - **Query Params:** `settings` (`string`, optional JSON string of `CopilotSettings`)
  - **Example:** `/Acts/10` (returns `.sfm` file download)

---

## 🔐 Environment Setup

`apps/copilot/.env.local` is created by the monorepo's onboarding step (`pnpm setup`, from the root). Fill in the secrets that are still blank there: `API_KEY_AQUIFER`, `GEMINI_PRIVATE_KEY`.

(If `.env.local` doesn't exist yet, or is missing a var after pulling a `.env` template change, run `pnpm setup:env` from the root to (re)generate it.)

---

## 💻 Local Development

From the **monorepo root**:

```bash
# Run Copilot dev server only
pnpm dev:copilot

# Or run all apps concurrently
pnpm dev
```

Or from within `apps/copilot`:

```bash
pnpm dev
```

---

## ✅ Testing & Verification

For unified monorepo testing, linting, and build verification commands, see [CONTRIBUTING.md](../../CONTRIBUTING.md) or run `pnpm precommit`.
