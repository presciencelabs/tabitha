SELECT '======= attaching GrammarIntroduction =======';
ATTACH DATABASE 'GrammarIntroduction.2023-06-21.mdb.sqlite' AS 'GrammarIntroduction';

SELECT '======= loading individual tables into Sources table =======';
INSERT INTO Sources
SELECT
	'Grammar Introduction',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	NULL,
	Notes
FROM Adjectives
WHERE Reference IS NOT NULL AND Verse IS NOT NULL
UNION ALL
SELECT
	'Grammar Introduction',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	NULL,
	Notes
FROM Adpositions
WHERE Reference IS NOT NULL AND Verse IS NOT NULL
UNION ALL
SELECT
	'Grammar Introduction',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	NULL,
	Notes
FROM Adverbs
WHERE Reference IS NOT NULL AND Verse IS NOT NULL
UNION ALL
SELECT
	'Grammar Introduction',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	NULL,
	Notes
FROM Clauses
WHERE Reference IS NOT NULL AND Verse IS NOT NULL
UNION ALL
SELECT
	'Grammar Introduction',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	NULL,
	Notes
FROM Discourse
WHERE Reference IS NOT NULL AND Verse IS NOT NULL
UNION ALL
SELECT
	'Grammar Introduction',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	NULL,
	Notes
FROM Noun_Phrases
WHERE Reference IS NOT NULL AND Verse IS NOT NULL
UNION ALL
SELECT
	'Grammar Introduction',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	NULL,
	Notes
FROM Nouns
WHERE Reference IS NOT NULL AND Verse IS NOT NULL
UNION ALL
SELECT
	'Grammar Introduction',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	NULL,
	Notes
FROM Pronouns
WHERE Reference IS NOT NULL AND Verse IS NOT NULL
UNION ALL
SELECT
	'Grammar Introduction',
	'Theta Grid Adjustments',
	substr(substr(Reference, instr(Reference, 's ') + 2), 1, instr(substr(Reference, instr(Reference, 's ') + 2), ':') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	NULL,
	Notes
FROM Theta_Grids
WHERE Reference IS NOT NULL AND Verse IS NOT NULL
UNION ALL
SELECT
	'Grammar Introduction',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	NULL,
	Notes
FROM Verbs
WHERE Reference IS NOT NULL AND Verse IS NOT NULL;

-- now individual book tables are no longer needed
-- DROP TABLE Adjectives;
-- DROP TABLE Adpositions;
-- DROP TABLE Adverbs;
-- DROP TABLE Clauses;
-- DROP TABLE Discourse;
-- DROP TABLE Noun_Phrases;
-- DROP TABLE Nouns;
-- DROP TABLE Pronouns;
-- DROP TABLE Theta_Grids;
-- DROP TABLE Verbs;

-- now get rid of all sqlite's scratchpad space (https://www.sqlite.org/lang_vacuum.html)
SELECT '======= cleaning database =======';
VACUUM;
