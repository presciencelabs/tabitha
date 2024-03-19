# Complex Terms

It will be necessary to load Complex Terms into the Ontology database for local testing.  For now, this is one way to do that:

1. Head into `.wrangler/state/v3/d1/miniflare-D1DatabaseObject` and find the latest sqlite db.
1. Dump it, e.g., `sqlite3 6b525cdeaa886c1a9ac55c2ce276f38af08391343dc36ca7865fad3ec1c71316.sqlite .dump > ../../../../../complex_terms.dump.sql`
1. Within the `app` dir, run `wrangler d1 execute Ontology.2024-03-12.3_0_9485 --local --file=../database/complex_terms/complex_terms.dump.sql
