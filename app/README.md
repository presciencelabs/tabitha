# Editor web app

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

## Error handling

TODO: will integrate Sentry once https://github.com/getsentry/sentry-javascript/issues/8291 is fixed.
