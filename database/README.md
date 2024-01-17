# Editor databases

## Create the table

`sqlite3 Editor.sqlite < <table>/<table>.sqlite.sql`

## Load the csv's

`sqlite3 Editor.sqlite < <table>/load_csv_data.sql`

## Dump

`sqlite3 Editor.sqlite .dump > Editor.sqlite.sql`

# Hosting

## Create the database

`wrangler d1 create <DB_NAME>`

> This always creates the database remotely and locally, it is empty though.

## Interacting with the database

> `--local` only operates on the local copy, i.e., the one in the closest .wrangler folder, removing that option will interact with the deployed database

`wrangler d1 execute <DB_NAME> --local --file=./Editor.sqlite.sql`
`wrangler d1 execute <DB_NAME> --local --command="select * from sqlite_master"`

