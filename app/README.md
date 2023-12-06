# Sources API

`pnpm i`

## Running locally

for the sake of CORS, `ontology.local.tbta.bible` needs to be added as an additonal alias for the loopback:

> `/etc/hosts` file on *nix systems
> ```bash
> 127.0.0.1       localhost ontology.local.tbta.bible
> ```


```bash
TBD
```

## Static analysis

### Formatting (prettier)

```bash
TBD
```

### Svelte's checker

```bash
TBD
```

### Linting (eslint)

```bash
pnpm lint
```

## Testing locally

```bash
TBD
```

> there may be a need to run `pnpm exec playwright install` when starting out to get the headless browsers for testing

## Building

Creates a production version of the app:

```bash
pnpm build
```

> You can preview the production build with `TBD`.

## Contributing

Always start your work in a new branch.

Run the following command as a last check before opening a PR

```bash
TBD
```

## Error handling

TODO: will integrate Sentry once https://github.com/getsentry/sentry-javascript/issues/8291 is fixed.
