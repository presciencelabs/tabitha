SELECT '======= creating new Sources table =======';
CREATE TABLE Sources (
	'type', -- e.g., Bible, Grammar Introduction, Community Development Texts
	'id_primary', -- for Bible, this would hold the book name, e.g., Genesis
	'id_secondary', -- for Bible, this would hold the chapter, e.g., 1
	'id_tertiary', -- for Bible, this would hold the verse, e.g., 1
	'phase_1_encoding',
	'phase_2_encoding',
	'comments',
	'notes'
); -- excluding columns not being used anymore as well as columns that don't have meaningful data, e.g., null or 0.  They can always be added back as the need arises.

-- now get rid of all sqlite's scratchpad space (https://www.sqlite.org/lang_vacuum.html)
SELECT '======= cleaning database =======';
VACUUM;
