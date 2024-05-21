# Editor databases

## Create the table

`sqlite3 Editor.sqlite < <table>/create_table.sql`

## Load the csv's

`sqlite3 Editor.sqlite < <table>/load_csv_data.sql`

## Dump

`sqlite3 Editor.sqlite .dump > Editor.sqlite.sql`

# Hosting

## Create the database

`wrangler d1 create <DB_NAME>`

> This always creates the database remotely and locally, it is empty though.

## Interacting with the database

> `--local` only operates on the local copy and is the default in wrangler v3.33.0+

> `--remote` operates on the remote database

`wrangler d1 execute <DB_NAME> --file=./Editor.sqlite.sql`

> NOTE: ⚠️ There are some manual steps when trying to import to remote ⚠️, check https://developers.cloudflare.com/d1/build-with-d1/import-data/#convert-sqlite-database-files for the latest instructions.

`wrangler d1 execute <DB_NAME> --command="select * from sqlite_master"`

