# Inflections

## Initial motivation

Originally created to get the stem of an inflected word — e.g. "took" wouldn't be found in the Ontology since only the stem "take" is stored there. [Lemmatization](https://en.wikipedia.org/wiki/Lemmatization) resolves "took" → "take" so the stem can be found.

> Services and existing libraries were considered, but maintaining consistency with TBTA's generation process (data and rules) was important.

## Extracting word forms from TBTA

1. Drop `./tbta_utils` into an up-to-date `TBTA` dir

> ⚠️ **TODO**: `tbta_utils` is now available for all target platforms — these instructions should be updated to pull it from the right per-platform directory and cover its usage there too.

1. Run `tbta_utils export-lexical-forms --language English --output-path <output directory>`
1. Place all `*.win.txt` files into the `win` directory
1. run `bun transform.ts` (This is also run automatically during the `targets/migrate.ts` migration)

This script will populate `./csv` with the newly transformed files. The TS function scrubs artifacts and formats the outputs to be used in the next `[Project].tbta.sqlite` migration.
