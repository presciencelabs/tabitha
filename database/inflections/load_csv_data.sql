
SELECT '======= deleting Inflections data =======';
DELETE FROM Inflections;
SELECT '======= Inflections data =======';
SELECT count(*) FROM Inflections;

-- https://www.sqlite.org/cli.html#importing_files_as_csv_or_other_formats
SELECT '======= loading adjectives data =======';
.import --csv inflections/csv/adjectives.csv Inflections
SELECT count(*) FROM Inflections where part_of_speech = 'Adjective';

SELECT '======= loading adverbs data =======';
.import --csv inflections/csv/adverbs.csv Inflections
SELECT count(*) FROM Inflections where part_of_speech = 'Adverb';

SELECT '======= loading nouns data =======';
.import --csv inflections/csv/nouns.csv Inflections
SELECT count(*) FROM Inflections where part_of_speech = 'Noun';

SELECT '======= loading verbs data =======';
.import --csv inflections/csv/verbs.csv Inflections
SELECT count(*) FROM Inflections where part_of_speech = 'Verb';

SELECT '======= Total rows =======';
SELECT count(*) FROM Inflections;
