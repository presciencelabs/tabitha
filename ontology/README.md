# Ontology

## Database
> ref:  https://www.sqlite.org
>
> https://sqlitebrowser.org has been a good tool and it's free

### Convert Ontology.mdb to a sqlite database

1. currently using a manual process, i.e., TBTA's `Ontology.mdb` -> Google Drive -> MDB Viewer app -> download sqlite file (`database/Ontology.VERSION.mdb.sqlite`)
1. `database/migrate.sql` can then be run against it to create the new database (`database/Ontology.tabitha.sqlite`)

### App

1. ✅ update linting rules (eslint)
1. ✅ update code formatting rules (prettier)
1. ✅ add a unit test (vitest)
1. ✅ add a playwright test (playwright)
1. ✅ update README
1. integrate picocss
1. build layout
1. integrate database
1. look into deployment (https://kit.svelte.dev/docs/adapter-cloudflare)
