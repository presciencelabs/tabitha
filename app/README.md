# Ontology web app

Available at [https://ontology.tbta.bible](https://ontology.tbta.bible)

## API

`https://ontology.tbta.bible/search?q=love[&scope=[**stems**|glosses|all]]`


## Local development

`pnpm i`

### Running locally

for the sake of CORS and accessing the sources/targets API, `ontology.local.tbta.bible` needs to be added as an additonal alias for the loopback:

> `/etc/hosts` file on *nix systems
> ```bash
> 127.0.0.1       localhost ontology.local.tbta.bible
> ```

```bash
pnpm dev
```

Then access the site via: [http://ontology.local.tbta.bible:8788](http://ontology.local.tbta.bible:8788)

### Static analysis

```bash
pnpm check
```

### Building

Creates a production version of the app:

```bash
pnpm build
```

### Contributing

Always start your work in a new branch.

Run the following command as a last check before opening a PR

```bash
pnpm precommit
```

## Error handling

TODO: will integrate Sentry once https://github.com/getsentry/sentry-javascript/issues/8291 is fixed.
