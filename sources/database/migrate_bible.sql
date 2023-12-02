SELECT '======= attaching Bible =======';
ATTACH DATABASE 'Bible.2023-10-20.mdb.sqlite' AS 'Bible';

SELECT '======= loading individual tables into Sources table =======';
INSERT INTO Sources
SELECT
	'Bible',
	'1 Chronicles',
	substr(substr(Reference, instr(Reference, 's ') + 2), 1, instr(substr(Reference, instr(Reference, 's ') + 2), ':') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM '1_Chronicles'
UNION ALL
SELECT
	'Bible',
	'1 Corinthians',
	substr(substr(Reference, instr(Reference, 's ') + 2), 1, instr(substr(Reference, instr(Reference, 's ') + 2), ':') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM '1_Corinthians'
UNION ALL
SELECT
	'Bible',
	'1 John',
	substr(substr(Reference, instr(Reference, 'n ') + 2), 1, instr(substr(Reference, instr(Reference, 'n ') + 2), ':') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM '1_John'
UNION ALL
SELECT
	'Bible',
	'1 Kings',
	substr(substr(Reference, instr(Reference, 's ') + 2), 1, instr(substr(Reference, instr(Reference, 's ') + 2), ':') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM '1_Kings'
UNION ALL
SELECT
	'Bible',
	'1 Peter',
	substr(substr(Reference, instr(Reference, 'r ') + 2), 1, instr(substr(Reference, instr(Reference, 'r ') + 2), ':') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM '1_Peter'
UNION ALL
SELECT
	'Bible',
	'1 Samuel',
	substr(substr(Reference, instr(Reference, 'l ') + 2), 1, instr(substr(Reference, instr(Reference, 'l ') + 2), ':') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM '1_Samuel'
UNION ALL
SELECT
	'Bible',
	'1 Thessalonians',
	substr(substr(Reference, instr(Reference, 's ') + 2), 1, instr(substr(Reference, instr(Reference, 's ') + 2), ':') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM '1_Thessalonians'
UNION ALL
SELECT
	'Bible',
	'1 Timothy',
	substr(substr(Reference, instr(Reference, 'y ') + 2), 1, instr(substr(Reference, instr(Reference, 'y ') + 2), ':') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM '1_Timothy'
UNION ALL
SELECT
	'Bible',
	'2 Chronicles',
	substr(substr(Reference, instr(Reference, 's ') + 2), 1, instr(substr(Reference, instr(Reference, 's ') + 2), ':') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM '2_Chronicles'
UNION ALL
SELECT
	'Bible',
	'2 Corinthians',
	substr(substr(Reference, instr(Reference, 's ') + 2), 1, instr(substr(Reference, instr(Reference, 's ') + 2), ':') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM '2_Corinthians'
UNION ALL
SELECT
	'Bible',
	'2 John',
	substr(substr(Reference, instr(Reference, 'n ') + 2), 1, instr(substr(Reference, instr(Reference, 'n ') + 2), ':') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM '2_John'
UNION ALL
SELECT
	'Bible',
	'2 Kings',
	substr(substr(Reference, instr(Reference, 's ') + 2), 1, instr(substr(Reference, instr(Reference, 's ') + 2), ':') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM '2_Kings'
UNION ALL
SELECT
	'Bible',
	'2 Peter',
	substr(substr(Reference, instr(Reference, 'r ') + 2), 1, instr(substr(Reference, instr(Reference, 'r ') + 2), ':') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM '2_Peter'
UNION ALL
SELECT
	'Bible',
	'2 Samuel',
	substr(substr(Reference, instr(Reference, 'l ') + 2), 1, instr(substr(Reference, instr(Reference, 'l ') + 2), ':') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM '2_Samuel'
UNION ALL
SELECT
	'Bible',
	'2 Thessalonians',
	substr(substr(Reference, instr(Reference, 's ') + 2), 1, instr(substr(Reference, instr(Reference, 's ') + 2), ':') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM '2_Thessalonians'
UNION ALL
SELECT
	'Bible',
	'2 Timothy',
	substr(substr(Reference, instr(Reference, 'y ') + 2), 1, instr(substr(Reference, instr(Reference, 'y ') + 2), ':') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM '2_Timothy'
UNION ALL
SELECT
	'Bible',
	'3 John',
	substr(substr(Reference, instr(Reference, 'n ') + 2), 1, instr(substr(Reference, instr(Reference, 'n ') + 2), ':') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM '3_John'
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Acts
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Amos
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Colossians
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Daniel
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Deuteronomy
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Ecclesiastes
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Ephesians
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Esther
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Exodus
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Ezekiel
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Ezra
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Galatians
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Genesis
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Habakkuk
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Haggai
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Hebrews
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Hosea
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Isaiah
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM James
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Jeremiah
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Job
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Joel
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM John
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Jonah
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Joshua
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Jude
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Judges
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Lamentations
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Leviticus
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Luke
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Malachi
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Mark
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Matthew
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Micah
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Nahum
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Nehemiah
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Numbers
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Obadiah
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Philemon
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Philippians
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Proverbs
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Psalms
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Revelations
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Romans
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Ruth
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Song_of_Solomon
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Titus
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Zechariah
UNION ALL
SELECT
	'Bible',
	substr(Reference, 1, instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	Comments,
	Notes
FROM Zephaniah;

-- now individual book tables are no longer needed
-- SELECT '======= removing individual book tables =======';
-- DROP TABLE '1_Chronicles';
-- DROP TABLE '1_Corinthians';
-- DROP TABLE '1_John';
-- DROP TABLE '1_Kings';
-- DROP TABLE '1_Peter';
-- DROP TABLE '1_Samuel';
-- DROP TABLE '1_Thessalonians';
-- DROP TABLE '1_Timothy';
-- DROP TABLE '2_Chronicles';
-- DROP TABLE '2_Corinthians';
-- DROP TABLE '2_John';
-- DROP TABLE '2_Kings';
-- DROP TABLE '2_Peter';
-- DROP TABLE '2_Samuel';
-- DROP TABLE '2_Thessalonians';
-- DROP TABLE '2_Timothy';
-- DROP TABLE '3_John';
-- DROP TABLE Acts;
-- DROP TABLE Amos;
-- DROP TABLE Colossians;
-- DROP TABLE Daniel;
-- DROP TABLE Deuteronomy;
-- DROP TABLE Ecclesiastes;
-- DROP TABLE Ephesians;
-- DROP TABLE Esther;
-- DROP TABLE Exodus;
-- DROP TABLE Ezekiel;
-- DROP TABLE Ezra;
-- DROP TABLE Galatians;
-- DROP TABLE Genesis;
-- DROP TABLE Habakkuk;
-- DROP TABLE Haggai;
-- DROP TABLE Hebrews;
-- DROP TABLE Hosea;
-- DROP TABLE Isaiah;
-- DROP TABLE James;
-- DROP TABLE Jeremiah;
-- DROP TABLE Job;
-- DROP TABLE Joel;
-- DROP TABLE John;
-- DROP TABLE Jonah;
-- DROP TABLE Joshua;
-- DROP TABLE Jude;
-- DROP TABLE Judges;
-- DROP TABLE Lamentations;
-- DROP TABLE Leviticus;
-- DROP TABLE Luke;
-- DROP TABLE Malachi;
-- DROP TABLE Mark;
-- DROP TABLE Matthew;
-- DROP TABLE Micah;
-- DROP TABLE Nahum;
-- DROP TABLE Nehemiah;
-- DROP TABLE Numbers;
-- DROP TABLE Obadiah;
-- DROP TABLE Philemon;
-- DROP TABLE Philippians;
-- DROP TABLE Proverbs;
-- DROP TABLE Psalms;
-- DROP TABLE Revelations;
-- DROP TABLE Romans;
-- DROP TABLE Ruth;
-- DROP TABLE Song_of_Solomon;
-- DROP TABLE Titus;
-- DROP TABLE Zechariah;
-- DROP TABLE Zephaniah;

-- Version table is not used
-- SELECT '======= removing Version table =======';
-- DROP TABLE Version;

-- now get rid of all sqlite's scratchpad space (https://www.sqlite.org/lang_vacuum.html)
SELECT '======= cleaning database =======';
VACUUM;
