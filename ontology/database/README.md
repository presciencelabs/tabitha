# Database

https://www.sqlite.org

## Convert Ontology.mdb to a sqlite database

1. currently using a manual process, i.e., TBTA's `Ontology.mdb` -> Google Drive -> MDB Viewer app -> download sqlite file (`Ontology.VERSION.mdb.sqlite`)
1. `database/migrate.sql` can then be run against it to create the new database (`Ontology.tabitha.sqlite`)

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

## Dump

`sqlite3 Ontology.tabitha.sqlite .dump > Ontology.tabitha.sqlite.sql`

## Hosting service

https://developers.cloudflare.com/d1
https://developers.cloudflare.com/workers/wrangler/commands/#d1

https://developers.cloudflare.com/workers/wrangler

`pnpx wrangler ...` will also work if you do not want to install wrangler

### Create database

`wrangler d1 create ontology`

### Interacting with the database

> `--local` only operates on the local copy, removing that option will interact with the deployed database

`wrangler d1 execute ontology --local --file=./Ontology.tabitha.sqlite.sql`

`wrangler d1 execute ontology --local --command="select part_of_speech, count(*) as count from Concepts group by part_of_speech order by count"`

### Deployment

D1 requires a worker so deployments will occur during the app deployment by virtue of the D1 binding.
