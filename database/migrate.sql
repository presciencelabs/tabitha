-- SQLite:  https://www.sqlite.org/lang.html

-- The following Hierarchy tables were remnants of an experiment that did not yield the desired results.  They can be removed altogether.
SELECT '======= removing experimental tables =======';
DROP TABLE AdjectiveHierarchy;
DROP TABLE AdpositionHierarchy;
DROP TABLE AdverbHierarchy;
DROP TABLE ConjunctionHierarchy;
DROP TABLE NounHierarchy;
DROP TABLE ParticleHierarchy;
DROP TABLE PronounHierarchy;
DROP TABLE VerbHierarchy;

SELECT '======= removing experimental columns =======';
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
SELECT '======= removing analyzer tables =======';
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

-- The following table was only for lookup purposes, those have been replicated in the app.
SELECT '======= removing Features_Source table =======';
DROP TABLE Features_Source;

-- this table looks like it's related to grammar rules, not quite ready for that capability yet.  May have to bring this table back later..
SELECT '======= removing Properties table =======';
DROP TABLE Properties;


-- The following table is only used by the current UI and will be replaced by the Intl collation browser API in the web-based app
SELECT '======= removing UI tables =======';
DROP TABLE Sorting_Sequence;

-- Tod claimed this column was no longer needed
SELECT '======= removing columns no longer needed =======';
ALTER TABLE Adjectives DROP COLUMN Distribution;

-- migrate parts of speech data into a single "concepts" table with a parts_of_speech column
SELECT '======= creating new Concepts table =======';
CREATE TABLE Concepts (
	'id' 						INTEGER PRIMARY KEY,
	'stem' 					TEXT,
	'sense' 					TEXT,
	'part_of_speech' 		TEXT,
	'occurrences' 			TEXT,
	'gloss' 					TEXT,
	'brief_gloss' 			TEXT,
	'categorization' 		TEXT,
	'examples' 				TEXT,
	'curated_examples'	TEXT,
	'level' 					INTEGER
); -- excluding columns that don't have meaningful data, e.g., null or 0.  They can always be added back as the need arises.

SELECT '======= loading Adjectives into Concepts table =======';
INSERT INTO Concepts
	SELECT ID, Roots, '', 'Adjective', Occurrences, "LN Gloss", "Brief Gloss", Categories, "Exhaustive Examples", Examples, Level
	FROM Adjectives;

SELECT '======= loading Adpositions into Concepts table =======';
INSERT INTO Concepts
	SELECT ID, Roots, '', 'Adposition', Occurrences, "LN Gloss", "Brief Gloss", Categories, "Exhaustive Examples", Examples, Level
	FROM Adpositions;

SELECT '======= loading Adverbs into Concepts table =======';
INSERT INTO Concepts
	SELECT ID, Roots, '', 'Adverb', Occurrences, "LN Gloss", "Brief Gloss", Categories, "Exhaustive Examples", Examples, Level
	FROM Adverbs;

SELECT '======= loading Conjunctions into Concepts table =======';
INSERT INTO Concepts
	SELECT ID, Roots, '', 'Conjunction', Occurrences, "LN Gloss", "Brief Gloss", Categories, "Exhaustive Examples", Examples, Level
	FROM Conjunctions;

SELECT '======= loading Nouns into Concepts table =======';
INSERT INTO Concepts
	SELECT ID, Roots, '', 'Noun', Occurrences, "LN Gloss", "Brief Gloss", Categories, "Exhaustive Examples", Examples, Level
	FROM Nouns;

SELECT '======= loading Particles into Concepts table =======';
INSERT INTO Concepts
	SELECT ID, Roots, '', 'Particle', Occurrences, "LN Gloss", "Brief Gloss", Categories, "Exhaustive Examples", Examples, Level
	FROM Particles;

SELECT '======= loading Pronouns into Concepts table =======';
INSERT INTO Concepts
	SELECT ID, Roots, '', 'Pronoun', Occurrences, "LN Gloss", "Brief Gloss", Categories, "Exhaustive Examples", Examples, Level
	FROM Pronouns;

SELECT '======= loading Verbs into Concepts table =======';
INSERT INTO Concepts
	SELECT ID, Roots, '', 'Verb', Occurrences, "LN Gloss", "Brief Gloss", Categories, "Exhaustive Examples", Examples, Level
	FROM Verbs;

SELECT '======= verifying numbers of rows transferred into Concepts table =======';
SELECT '-------------------------';
SELECT 'Adjectives: 					', count(ID) FROM Adjectives;
SELECT 'Concepts[Adjective]: 		', count(id) FROM Concepts WHERE part_of_speech = 'Adjective';
SELECT '-------------------------';
SELECT 'Adpositions: 				', count(ID) FROM Adpositions;
SELECT 'Concepts[Adpositions]: 	', count(id) FROM Concepts WHERE part_of_speech = 'Adposition';
SELECT '-------------------------';
SELECT 'Adverbs: 						', count(ID) FROM Adverbs;
SELECT 'Concepts[Adverbs]:			', count(id) FROM Concepts WHERE part_of_speech = 'Adverb';
SELECT '-------------------------';
SELECT 'Conjunctions:				', count(ID) FROM Conjunctions;
SELECT 'Concepts[Conjunctions]:	', count(id) FROM Concepts WHERE part_of_speech = 'Conjunction';
SELECT '-------------------------';
SELECT 'Nouns:							', count(ID) FROM Nouns;
SELECT 'Concepts[Nouns]:			', count(id) FROM Concepts WHERE part_of_speech = 'Noun';
SELECT '-------------------------';
SELECT 'Particles:					', count(ID) FROM Particles;
SELECT 'Concepts[Particles]:		', count(id) FROM Concepts WHERE part_of_speech = 'Particle';
SELECT '-------------------------';
SELECT 'Pronouns:						', count(ID) FROM Pronouns;
SELECT 'Concepts[Pronouns]:		', count(id) FROM Concepts WHERE part_of_speech = 'Pronoun';
SELECT '-------------------------';
SELECT 'Verbs:							', count(ID) FROM Verbs;
SELECT 'Concepts[Verbs]:			', count(id) FROM Concepts WHERE part_of_speech = 'Verb';
SELECT '-------------------------';

-- now individual parts of speech tables are no longer needed
SELECT '======= removing individual parts of speech tables =======';
DROP TABLE Adjectives;
DROP TABLE Adpositions;
DROP TABLE Adverbs;
DROP TABLE Conjunctions;
DROP TABLE Nouns;
DROP TABLE Particles;
DROP TABLE Pronouns;
DROP TABLE Verbs;

-- simplify version info
SELECT '======= simplifying version table =======';
CREATE TABLE Version AS
	SELECT Version as version FROM OntologyVersion;
DROP TABLE OntologyVersion;

-- now get rid of all sqlite's scratchpad space (https://www.sqlite.org/lang_vacuum.html)
SELECT '======= cleaning database =======';
VACUUM;
