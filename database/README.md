# Database

https://www.sqlite.org

## Convert Ontology.mdb to a sqlite database

1. currently using a manual process, i.e., TBTA's `Ontology.mdb` -> Google Drive -> MDB Viewer app -> download sqlite file (`Ontology.VERSION.mdb.sqlite`)
1. `database/migrate.sql` can then be run against it to create the new database (`Ontology.tabitha.sqlite`)

> if an mdb is larger than 40M, the MDB Viewer app will not work unfortunately.  There is an option to buy MDB ACCB Viewer (for macs).

## Interacting with the database locally

### GUI

https://sqlitebrowser.org has been a good tool and it's free

### Command line

`sqlite3` is needed, thankfully it's already installed on Mac, otherwise:  https://www.sqlite.org/download.html

#### Getting help

1. `sqlite3`
1. `sqlite> .help` *https://www.sqlite.org/cli.html#special_commands_to_sqlite3_dot_commands_*
1. `^d` to exit shell

or

https://www.sqlite.org/cli.html#command_line_options
`sqlite3 -help`

or

`sqlite3 Ontology.tabitha.sqlite .help`

### Dump

`sqlite3 Ontology.tabitha.sqlite .dump > Ontology.tabitha.sqlite.sql`

## Hosting service

https://developers.cloudflare.com/d1
https://developers.cloudflare.com/workers/wrangler/commands/#d1

https://developers.cloudflare.com/workers/wrangler

`pnpx wrangler ...` will also work if you do not want to install wrangler

### Create database

`wrangler d1 create <DB_NAME>`

> This always creates the database remotely and locally, it is empty though.

### Interacting with the database

> `--local` only operates on the local copy and is the default in wrangler v3.33.0+
> `--remote` operates on the remote database

`wrangler d1 execute <DB_NAME> --file=./<DB_NAME>.tabitha.sqlite.sql`

`wrangler d1 execute <DB_NAME> --command="select part_of_speech, count(*) as count from Concepts group by part_of_speech order by count; select * from Version;"`

### Deployment

D1 requires a worker so deployments will occur during the app deployment by virtue of the D1 binding.

## Upgrading

### Diffing to understand changes

Databases can be diffed using sqldiff (https://www.sqlite.org/sqldiff.html), mac users `brew install sqldiff`

### Migrate

1. make a new database from downloaded one, e.g., `cp Ontology.YYYY-MM-DD.mdb.sqlite Ontology.YYYY-MM-DD.#_#_####.mdb.sqlite`
1. run migration, e.g., `sqlite3 -separator '' -init migrate.sql Ontology.YYYY-MM-DD.#_#_####.mdb.sqlite .exit`
1. rename migrated database, e.g., `cp Ontology.YYYY-MM-DD.#_#_####.mdb.sqlite Ontology.YYYY-MM-DD.#_#_####.tabitha.sqlite`
1. add derived senses, e.g., `bun senses.js Ontology.YYYY-MM-DD.#_#_####.tabitha.sqlite`
1. dump migrated database, e.g., `sqlite3 Ontology.YYYY-MM-DD.#_#_####.tabitha.sqlite .dump > Ontology.YYYY-MM-DD.#_#_####.tabitha.sqlite.sql`
1. compare diff's of `.sql` files if interested
1.	create new database, e.g., `wrangler d1 create Ontology.YYYY-MM-DD.#_#_####`  (need to update local `wrangler.toml`'s with new info)
1. wherever testing is going to occur, load the data there locally only, e.g., `wrangler d1 execute Ontology.YYYY-MM-DD.#_#_#### --file=./Ontology.YYYY-MM-DD.#_#_####.tabitha.sqlite.sql`
1. add latest complex terms by running a local test below. (⚠️ see ./complex_terms/README.md for additional steps required now to update the remote database)
1. test app with new database locally
1. deploy to remote, e.g., `wrangler d1 execute Ontology.YYYY-MM-DD.#_#_#### --file=./Ontology.YYYY-MM-DD.#_#_####.tabitha.sqlite.sql`
1. need to run another deployment either via `push` or "retry deployment" in Cloudflare dashboard

## Automated updates

### Complex terms

Complex terms will be updated from the "How to" spreadsheet to the database on a regular schedule.

#### Testing locally

From within the `complex_terms` dir:

`wrangler dev --test-scheduled`

 Hit `curl 'http://localhost:8787/__scheduled'` in a separate terminal to run it.

#### Deployment

> ⚠️ You will need Cloudflare credentials to deploy.

From within `./complex_terms/` run `wrangler deploy`
