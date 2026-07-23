# Tabitha Copilot

Available at [https://copilot.tabitha.bible](https://copilot.tabitha.bible)

## API

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

## Prerequisites

- **pnpm** - used for package management

## Setup

Copy `.env` to `.env.local` and supply the required tokens (you can get them from another team member):

```sh
cp .env .env.local
```

## Developing

Install dependencies with `pnpm install` and start a development server:

```sh
pnpm install

pnpm run dev
```

## Building

To create a production version of your app:

```sh
pnpm run build
```

You can preview the production build with `pnpm run preview`.
app available at [http://localhost.tabitha.bible:8793](http://localhost.tabitha.bible:8793)
