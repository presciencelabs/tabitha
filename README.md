# TaBiThA

## initial thoughts
✅ migrate data in access.mbd into a new storage mechanism, sqlite, kv...? not sure, need to see the access.mdb first

✅ sveltekit app

determine authn

add authz for Tod and Richard perhaps, they should be the only ones that can change things...everyone else can read only... what about public?  can it be public?

data could be distributed... rarely updated

should we use an adapter to get data from our ontology into TBTA's expected format or update TBTA to utilize a new data source?  Building the adapter could prepare us for the possibility of a WASM engine one day... getting data between the engine and our database for generation
