SELECT '======= attaching CommunityDevelopmentTexts =======';
ATTACH DATABASE 'CommunityDevelopmentTexts.2022-05-03.mdb.sqlite' AS 'CommunityDevelopmentTexts';

SELECT '======= loading individual tables into Sources table =======';
INSERT INTO Sources
SELECT
	'Community Development Texts',
	substr(Reference, 1, instr(Reference, ':') - 3),
	substr(substr(Reference, instr(Reference, 'a ') + 2), 1, instr(substr(Reference, instr(Reference, 'a ') + 2), ':') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	NULL,
	Notes
FROM 'Avian_Influenza'
UNION ALL
SELECT
	'Community Development Texts',
	substr(Reference, 1, instr(Reference, ':') - 3),
	substr(substr(Reference, instr(Reference, 'e ') + 2), 1, instr(substr(Reference, instr(Reference, 'e ') + 2), ':') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	NULL,
	Notes
FROM 'Infected_Eye'
UNION ALL
SELECT
	'Community Development Texts',
	substr(Reference, 1, instr(Reference, ':') - 3),
	substr(substr(Reference, instr(Reference, 'y ') + 2), 1, instr(substr(Reference, instr(Reference, 'y ') + 2), ':') - 1),
	substr(Reference, instr(Reference, ':') + 1),
	Verse,
	AnalyzedVerse,
	NULL,
	Notes
FROM 'Kandes_Story';

-- now individual book tables are no longer needed
-- SELECT '======= removing individual book tables =======';
-- DROP TABLE 'Avian_Influenza';
-- DROP TABLE 'Infected_Eye';
-- DROP TABLE 'Kandes_Story';

-- Version table is not used
-- SELECT '======= removing Version table =======';
-- DROP TABLE Version;

-- now get rid of all sqlite's scratchpad space (https://www.sqlite.org/lang_vacuum.html)
SELECT '======= cleaning database =======';
VACUUM;
