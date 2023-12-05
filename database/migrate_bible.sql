SELECT '======= attaching Bible =======';
ATTACH DATABASE 'Bible.2023-10-20.mdb.sqlite' AS 'Bible';

SELECT '======= loading individual tables into Sources table =======';
INSERT INTO Sources
SELECT
    'Bible',
    'Genesis',
	 -- The Reference column holds:  Genesis 1:1
	 -- the two following incantations of substr() extract the chapter and verse number into separate columns
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
    'Exodus',
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
    'Leviticus',
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
    'Numbers',
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
    'Deuteronomy',
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
    'Joshua',
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
    'Judges',
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
    'Ruth',
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
    '1 Samuel',
    substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
    substr(Reference, instr(Reference, ':') + 1),
    Verse,
    AnalyzedVerse,
    Comments,
    Notes
FROM '1_Samuel'
UNION ALL
SELECT
    'Bible',
    '2 Samuel',
    substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
    substr(Reference, instr(Reference, ':') + 1),
    Verse,
    AnalyzedVerse,
    Comments,
    Notes
FROM '2_Samuel'
UNION ALL
SELECT
    'Bible',
    '1 Kings',
    substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
    substr(Reference, instr(Reference, ':') + 1),
    Verse,
    AnalyzedVerse,
    Comments,
    Notes
FROM '1_Kings'
UNION ALL
SELECT
    'Bible',
    '2 Kings',
    substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
    substr(Reference, instr(Reference, ':') + 1),
    Verse,
    AnalyzedVerse,
    Comments,
    Notes
FROM '2_Kings'
UNION ALL
SELECT
    'Bible',
    '1 Chronicles',
    substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
    substr(Reference, instr(Reference, ':') + 1),
    Verse,
    AnalyzedVerse,
    Comments,
    Notes
FROM '1_Chronicles'
UNION ALL
SELECT
    'Bible',
    '2 Chronicles',
    substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
    substr(Reference, instr(Reference, ':') + 1),
    Verse,
    AnalyzedVerse,
    Comments,
    Notes
FROM '2_Chronicles'
UNION ALL
SELECT
    'Bible',
    'Ezra',
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
    'Nehemiah',
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
    'Esther',
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
    'Job',
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
    'Psalms',
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
    'Proverbs',
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
    'Ecclesiastes',
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
    'Song_of_Solomon',
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
    'Isaiah',
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
    'Jeremiah',
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
    'Lamentations',
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
    'Ezekiel',
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
    'Daniel',
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
    'Hosea',
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
    'Joel',
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
    'Amos',
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
    'Obadiah',
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
    'Jonah',
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
    'Micah',
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
    'Nahum',
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
    'Habakkuk',
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
    'Zephaniah',
    substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
    substr(Reference, instr(Reference, ':') + 1),
    Verse,
    AnalyzedVerse,
    Comments,
    Notes
FROM Zephaniah
UNION ALL
SELECT
    'Bible',
    'Haggai',
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
    'Zechariah',
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
    'Malachi',
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
    'Matthew',
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
    'Mark',
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
    'Luke',
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
    'John',
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
    'Acts',
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
    'Romans',
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
    '1_Corinthians',
    substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
    substr(Reference, instr(Reference, ':') + 1),
    Verse,
    AnalyzedVerse,
    Comments,
    Notes
FROM '1_Corinthians'
UNION ALL
SELECT
    'Bible',
    '2_Corinthians',
    substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
    substr(Reference, instr(Reference, ':') + 1),
    Verse,
    AnalyzedVerse,
    Comments,
    Notes
FROM '2_Corinthians'
UNION ALL
SELECT
    'Bible',
    'Galatians',
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
    'Ephesians',
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
    'Philippians',
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
    'Colossians',
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
    '1_Thessalonians',
    substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
    substr(Reference, instr(Reference, ':') + 1),
    Verse,
    AnalyzedVerse,
    Comments,
    Notes
FROM '1_Thessalonians'
UNION ALL
SELECT
    'Bible',
    '2_Thessalonians',
    substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
    substr(Reference, instr(Reference, ':') + 1),
    Verse,
    AnalyzedVerse,
    Comments,
    Notes
FROM '2_Thessalonians'
UNION ALL
SELECT
    'Bible',
    '1_Timothy',
    substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
    substr(Reference, instr(Reference, ':') + 1),
    Verse,
    AnalyzedVerse,
    Comments,
    Notes
FROM '1_Timothy'
UNION ALL
SELECT
    'Bible',
    '2_Timothy',
    substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
    substr(Reference, instr(Reference, ':') + 1),
    Verse,
    AnalyzedVerse,
    Comments,
    Notes
FROM '2_Timothy'
UNION ALL
SELECT
    'Bible',
    'Titus',
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
    'Philemon',
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
    'Hebrews',
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
    'James',
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
    '1_Peter',
    substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
    substr(Reference, instr(Reference, ':') + 1),
    Verse,
    AnalyzedVerse,
    Comments,
    Notes
FROM '1_Peter'
UNION ALL
SELECT
    'Bible',
    '2_Peter',
    substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
    substr(Reference, instr(Reference, ':') + 1),
    Verse,
    AnalyzedVerse,
    Comments,
    Notes
FROM '2_Peter'
UNION ALL
SELECT
    'Bible',
    '1_John',
    substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
    substr(Reference, instr(Reference, ':') + 1),
    Verse,
    AnalyzedVerse,
    Comments,
    Notes
FROM '1_John'
UNION ALL
SELECT
    'Bible',
    '2_John',
    substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
    substr(Reference, instr(Reference, ':') + 1),
    Verse,
    AnalyzedVerse,
    Comments,
    Notes
FROM '2_John'
UNION ALL
SELECT
    'Bible',
    '3_John',
    substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
    substr(Reference, instr(Reference, ':') + 1),
    Verse,
    AnalyzedVerse,
    Comments,
    Notes
FROM '3_John'
UNION ALL
SELECT
    'Bible',
    'Jude',
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
    'Revelation',
    substr(Reference, instr(Reference, ' ') + 1, instr(Reference, ':') - instr(Reference, ' ') - 1),
    substr(Reference, instr(Reference, ':') + 1),
    Verse,
    AnalyzedVerse,
    Comments,
    Notes
FROM Revelations;

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
