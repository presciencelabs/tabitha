# Ontology web app

`pnpm install`

## Running locally

```bash
npm run dev
```

## Static analysis

### Formatting (prettier)

```bash
npm run format
```

### Svelte's checker

```bash
npm run check
```

### Linting (eslint)

```bash
npm run lint
```

## Testing locally

```bash
npm test
```

> there may be a need to run `pnpm exec playwright install` when starting out to get the headless browsers for testing

## Building

Creates a production version of the app:

```bash
npm run build
```

> You can preview the production build with `npm run preview`.

## Contributing

Always start your work in a new branch.

Run the following command as a last check before opening a PR

```bash
npm run precommit
```
