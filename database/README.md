# Initial motivation

Originally created to get the stem of an inflected form of a word, e.g., "took" would not be found in the Ontology
because only the stem, "take", was in the Ontology.  A process known as [lemmatization](https://en.wikipedia.org/wiki/Lemmatization) is needed so "took" will result
in "take" and that stem has a chance to be found.

> Services and existing libraries were considered but maintaining consistency with TBTA's generation process was important, data and rules.

# Extracting word forms from TBTA

1. Use the English project
1. Lexicon -> [Nouns|Verbs|Adverbs|Adjectives] -> (View)Forms -> (Function)Export to File
	1. Nouns: **only include** `Stem, Plural`
	1. Verbs: **only include** `Stem, Past, Perfect, Participle, Third Singular Present`
	1. Adverbs: **only include** `Stem, Comparative, Superlative`
	1. Adjectives: **only include** `Stem, Comparative, Superlative`
1. Ensure "Blank line between entries" is checked
1. Click OK
1. Save output to an appropriately named file, e.g., `lexical_forms_[nouns|verbs|adverbs|adjectives].win.txt`
1. Ensure data was exported properly

# Preparing for database load

1. Place all `*.win.txt` files into the `inflections/win` directory
1. run `./transform.sh`

This script will populate `inflections/csv` with the newly transformed files.
