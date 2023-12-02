TODO: still need to work through the MissionsDocuments database conversion since it's trying to fit a square peg into a round hole... will come back to it when there's more data in it.
# Database

https://www.sqlite.org

## Convert the source mdb's to a sqlite database

1. currently using a manual process, i.e., TBTA's `*.mdb` -> Google Drive -> MDB Viewer app -> download sqlite file (`*.VERSION.mdb.sqlite`)
1. `grep ATTACH *.sql` to ensure filenames are accurate
1. `sqlite3 Sources.YYYY-MM-DD.tabitha.sqlite < *.sql` to create and load the database

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

`sqlite3 Sources.YYYY-MM-DD.tabitha.sqlite .help`

### Dump

`sqlite3 Sources.YYYY-MM-DD.tabitha.sqlite .dump > Sources.YYYY-MM-DD.tabitha.sqlite.sql`

## Hosting service

https://developers.cloudflare.com/d1
https://developers.cloudflare.com/workers/wrangler/commands/#d1

https://developers.cloudflare.com/workers/wrangler

`pnpx wrangler ...` will also work if you do not want to install wrangler

### Create database

`wrangler d1 create <DB_NAME>`

### Interacting with the database

> `--local` only operates on the local copy, removing that option will interact with the deployed database

`wrangler d1 execute <DB_NAME> --local --file=./<DB_NAME>.tabitha.sqlite.sql`

`wrangler d1 execute <DB_NAME> --local --command="select type, count(distinct id_primary) from Sources group by type"`

### Deployment

D1 requires a worker so deployments will occur during the app deployment by virtue of the D1 binding.

