# Inflections

## Initial motivation

Originally created to get the stem of an inflected form of a word, e.g., "took" would not be found in the Ontology
because only the stem, "take", was in the Ontology.  A process known as [lemmatization](https://en.wikipedia.org/wiki/Lemmatization) is needed so "took" will result
in "take" and that stem has a chance to be found.

> Services and existing libraries were considered but maintaining consistency with TBTA's generation process was important, data and rules.

## Extracting word forms from TBTA

1. Drop `./tbta_utils` into an up-to-date `TBTA` dir

!!!!!!!   TODO: tbta_utils is currently available for all target platforms, these instructions should be updated to get those from the appropriate directory as well as the usage !!!!!!!

1. Run `tbta_utils export-lexical-forms --language English --output-path <output directory>`
1. Place all `*.win.txt` files into the `win` directory
1. run `bun transform.ts` (This is also run automatically during the `targets/migrate.ts` migration)

This script will populate `./csv` with the newly transformed files. The TS function scrubs artifacts and formats the outputs to be used in the next `[Project].tbta.sqlite` migration.
