# Editor

## Loading databases
> within the `app` dir so these loads remain local to `app` only

`wrangler d1 execute Editor.YYYY-MM-DD --file=../database/Editor.sqlite.sql`

You may have to run `wrangler d1 execute Editor.YYYY-MM-DD --command="DROP TABLE inflections"` before running the above command.
