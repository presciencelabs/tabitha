# tabitha-editor

## Loading databases
> within the `app` dir so these loads remain local to `app` only

`wrangler d1 execute Ontology.2023-12-07.3_0_9485 --local --file=../../tabitha-ontology/database/Ontology.2023-12-07.3_0_9485.tabitha.sqlite.sql`

`wrangler d1 execute Editor.YYYY-MM-DD --local --file=../database/Editor.sqlite.sql`