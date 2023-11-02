-- SQLite:  https://www.sqlite.org/lang.html

-- The following Hierarchy tables were remnants of an experiment that did not yield the desired results.  They can be removed altogether.
DROP TABLE AdjectiveHierarchy;
DROP TABLE AdpositionHierarchy;
DROP TABLE AdverbHierarchy;
DROP TABLE ConjunctionHierarchy;
DROP TABLE NounHierarchy;
DROP TABLE ParticleHierarchy;
DROP TABLE PronounHierarchy;
DROP TABLE VerbHierarchy;

ALTER TABLE Adjectives 		DROP COLUMN ParentID;
ALTER TABLE Adjectives		DROP COLUMN "Linguists Assistant";
ALTER TABLE Adpositions		DROP COLUMN ParentID;
ALTER TABLE Adpositions		DROP COLUMN "Linguists Assistant";
ALTER TABLE Adverbs			DROP COLUMN ParentID;
ALTER TABLE Adverbs			DROP COLUMN "Linguists Assistant";
ALTER TABLE Conjunctions	DROP COLUMN ParentID;
ALTER TABLE Conjunctions	DROP COLUMN "Linguists Assistant";
ALTER TABLE Nouns 			DROP COLUMN ParentID;
ALTER TABLE Nouns 			DROP COLUMN "Linguists Assistant";
ALTER TABLE Particles 		DROP COLUMN ParentID;
ALTER TABLE Particles 		DROP COLUMN "Linguists Assistant";
ALTER TABLE Pronouns 		DROP COLUMN ParentID;
ALTER TABLE Pronouns 		DROP COLUMN "Linguists Assistant";
ALTER TABLE Verbs 			DROP COLUMN ParentID;
ALTER TABLE Verbs 			DROP COLUMN "Linguists Assistant";

-- The following tables are used by the analyzer, which, for this app, are not necessary.  They can be removed altogether and brought back if/when it's determined the analyzer is needed.
DROP TABLE DifferencesEnglishBible;
DROP TABLE DifferencesMultipleTexts;
DROP TABLE Rules_ComplexConcepts;
DROP TABLE Rules_DeleteAmbiguousPOSTags;
DROP TABLE Rules_FeatureSetting;
DROP TABLE Rules_FindReplace;
DROP TABLE Rules_Groups;
DROP TABLE Rules_PhraseStructure;
DROP TABLE Rules_SourceAnalyzing;
DROP TABLE Rules_Transfer;
DROP TABLE General_Notes; -- this one is special, while it was being used by the analyzer, it was not being used very much.  Tod does see value in having a table for notes that can be displayed to users so we may bring this back in some form.

-- The following table is only used by the current UI and will be replaced by the Intl collation browser API in the web-based app
DROP TABLE Sorting_Sequence;

-- Tod claimed this column was no longer needed
ALTER TABLE Adjectives DROP COLUMN Distribution;

-- migrate parts of speech data into a single "concepts" table with a parts_of_speech column
CREATE TABLE Concepts (
	'id' INTEGER PRIMARY KEY,
	'roots', -- TODO: remove this after API changes have been made to the app
	'stem',
	'part_of_speech',
	'occurrences',
	'gloss',
	'brief_gloss',
	'categories',
	'examples',
	'exhaustive_examples',
	'level' INTEGER
); -- excluding columns that don't have meaningful data, e.g., null or 0.  They can always be added back as the need arises.

INSERT INTO Concepts
	SELECT ID, Roots, Roots, 'Adjective', Occurrences, "LN Gloss", "Brief Gloss", Categories, Examples, "Exhaustive Examples", Level
	FROM Adjectives;

INSERT INTO Concepts
	SELECT ID, Roots, Roots, 'Adposition', Occurrences, "LN Gloss", "Brief Gloss", Categories, Examples, "Exhaustive Examples", Level
	FROM Adpositions;

INSERT INTO Concepts
	SELECT ID, Roots, Roots, 'Adverb', Occurrences, "LN Gloss", "Brief Gloss", Categories, Examples, "Exhaustive Examples", Level
	FROM Adverbs;

INSERT INTO Concepts
	SELECT ID, Roots, Roots, 'Conjunction', Occurrences, "LN Gloss", "Brief Gloss", Categories, Examples, "Exhaustive Examples", Level
	FROM Conjunctions;

INSERT INTO Concepts
	SELECT ID, Roots, Roots, 'Noun', Occurrences, "LN Gloss", "Brief Gloss", Categories, Examples, "Exhaustive Examples", Level
	FROM Nouns;

INSERT INTO Concepts
	SELECT ID, Roots, Roots, 'Particle', Occurrences, "LN Gloss", "Brief Gloss", Categories, Examples, "Exhaustive Examples", Level
	FROM Particles;

INSERT INTO Concepts
	SELECT ID, Roots, Roots, 'Pronoun', Occurrences, "LN Gloss", "Brief Gloss", Categories, Examples, "Exhaustive Examples", Level
	FROM Pronouns;

INSERT INTO Concepts
	SELECT ID, Roots, Roots, 'Verb', Occurrences, "LN Gloss", "Brief Gloss", Categories, Examples, "Exhaustive Examples", Level
	FROM Verbs;

SELECT 'rows from Adjectives', count(ID) FROM Adjectives;
SELECT 'Adjective from Concepts', count(id) FROM Concepts WHERE part_of_speech = 'Adjective';

SELECT 'rows from Adpositions', count(ID) FROM Adpositions;
SELECT 'Adpositions from Concepts', count(id) FROM Concepts WHERE part_of_speech = 'Adposition';

SELECT 'rows from Adverbs', count(ID) FROM Adverbs;
SELECT 'Adverbs from Concepts', count(id) FROM Concepts WHERE part_of_speech = 'Adverb';

SELECT 'rows from Conjunctions', count(ID) FROM Conjunctions;
SELECT 'Conjunctions from Concepts', count(id) FROM Concepts WHERE part_of_speech = 'Conjunction';

SELECT 'rows from Nouns', count(ID) FROM Nouns;
SELECT 'Nouns from Concepts', count(id) FROM Concepts WHERE part_of_speech = 'Noun';

SELECT 'rows from Particles', count(ID) FROM Particles;
SELECT 'Particles from Concepts', count(id) FROM Concepts WHERE part_of_speech = 'Particle';

SELECT 'rows from Pronouns', count(ID) FROM Pronouns;
SELECT 'Pronouns from Concepts', count(id) FROM Concepts WHERE part_of_speech = 'Pronoun';

SELECT 'rows from Verbs', count(ID) FROM Verbs;
SELECT 'Verbs from Concepts', count(id) FROM Concepts WHERE part_of_speech = 'Verb';

-- now individual parts of speech tables are no longer needed
DROP TABLE Adjectives;
DROP TABLE Adpositions;
DROP TABLE Adverbs;
DROP TABLE Conjunctions;
DROP TABLE Nouns;
DROP TABLE Particles;
DROP TABLE Pronouns;
DROP TABLE Verbs;

-- simplify version info
CREATE TABLE Version AS
	SELECT Version as version FROM OntologyVersion;

--TODO: don't do this until the API changes in the app have been made. DROP TABLE OntologyVersion;

-- now get rid of all sqlite's scratchpad space (https://www.sqlite.org/lang_vacuum.html)
VACUUM;
