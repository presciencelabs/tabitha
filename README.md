# Ontology web app

Available at [https://ontology.tbta.bible](https://ontology.tbta.bible)

## API

`https://ontology.tbta.bible/search?q=love[&scope=[**stems**|glosses|all]]`

## Local development

`pnpm i`

### Running locally

#### 1. Avoiding CORS errors

This app accesses the sources/targets API, therefore `ontology.local.tbta.bible` needs to be added as an additonal alias for the loopback:

```
`/etc/hosts` file on *nix systems

127.0.0.1	localhost ontology.local.tbta.bible
```

#### 2. Load the database

Dump files can be found under the "Artifacts" section of the workflow runs of the databases repo:  https://github.com/presciencelabs/tabitha-databases/actions/workflows/deploy.yml

Running the following command will load the data locally:

`wrangler d1 execute <DB_NAME_FROM_WRANGLER_TOML_FILE> --file=<DB_NAME_FROM_WRANGLER_TOML_FILE>.tabitha.sqlite.sql`

#### 3. Start the app

> `pnpm build` will need to be run the first time only.

```bash
pnpm dev
```

The site should then be available here: [http://ontology.local.tbta.bible:8788](http://ontology.local.tbta.bible:8788)

### Static analysis

```bash
pnpm check
```

### Testing locally

> `pnpm exec playwright install` will need to be run at least once to get the headless browsers for testing.

```bash
pnpm test:e2e
```

🐛 debugging tests can be done with `pnpm test:e2e:dev`.

### Contributing

Always start your work in a new branch.

Run the following command as a last check before opening a PR

```bash
pnpm precommit
```

## Error handling

TODO: will integrate Sentry once https://github.com/getsentry/sentry-javascript/issues/8291 is fixed.
