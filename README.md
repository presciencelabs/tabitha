# Sources API

Available at [https://sources.tbta.bible](https://sources.tbta.bible)

## API

`https://sources.tbta.bible/Bible/Acts/10/9`

## Local development

`pnpm i`

### Running locally

#### 1. Load the database

Dump files can be found under the 'databases' folder within the databases repo:  https://github.com/presciencelabs/tabitha-databases/databases

Running the following command will load the data locally:

`pnpx wrangler d1 execute <DB_NAME_FROM_WRANGLER_TOML_FILE> --file <DB_NAME_FROM_WRANGLER_TOML_FILE>.tabitha.sqlite.sql`

#### 2. Start the app

> `pnpm build` will need to be run the first time only.

```bash
pnpm dev
```

The site should then be available here: [http://localhost.tbta.bible:8789](http://localhost.tbta.bible:8789)

## Static analysis

```bash
pnpm check
```
### Testing locally

> `pnpm exec playwright install` will need to be run at least once to get the headless browsers for testing.

```bash
pnpm test:e2e
```

🐛 debugging tests can be done with `pnpm test:e2e:dev`.

## Contributing

Always start your work in a new branch.

Run the following command as a last check before opening a PR

```bash
pnpm precommit
```
