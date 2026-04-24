# Tabitha Copilot

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
