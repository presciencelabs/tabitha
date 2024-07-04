# Complex Terms

It will be necessary to load Complex Terms into the Ontology database for local testing.  For now, this is one way to do that:

1. If needed, manually trigger the scheduled task that fetches the data from the How-To document
   1. From within this `/complex_terms` directory, run `wrangler dev --test-scheduled`
   1. Trigger the scheduled task by navigating to `http://localhost:8787/__scheduled` in the browser or via `curl`
1. The data from the most recent fetch is stored in an sqlite db at `.wrangler/state/v3/d1/miniflare-D1DatabaseObject`
   1. Dump that file as `/complex_terms/complex_terms.dump.sql`. e.g. from within the above folder, run `sqlite3 6b525cdeaa886c1a9ac55c2ce276f38af08391343dc36ca7865fad3ec1c71316.sqlite .dump > ../../../../../complex_terms.dump.sql`
1. In `complex_terms.dump.sql`, remove the first few lines before `CREATE TABLE COMPLEX_TERMS (`, as well as the `COMMIT;` line at the end of the file
1. Within the `app` dir, run `wrangler d1 execute <Ontology.DB_NAME> --file=../database/complex_terms/complex_terms.dump.sql`
