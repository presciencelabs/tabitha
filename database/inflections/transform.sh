#!/bin/bash

for win_file in win/*; do
	# win_file = win/lexical_forms_nouns.win.txt

	unix_file=$(basename $win_file | sed 's/\.win//')
	# unix_file = lexical_forms_nouns.txt

	echo "converting $win_file => $unix_file"
	# remove the win stuff, i.e., anything that is not one of these:
	#	\11 = tab
	#	\12 = newline
	#	\15 = carriage return
	#	\40-\176 = printable ASCII characters
	tr -cd '\11\12\15\40-\176' < $win_file > unix/$unix_file

	part_of_speech_file=$(echo $unix_file | sed -E 's/lexical_forms_(.*)\.txt$/\1\.csv/')
	# part_of_speech_file = nouns.csv

	part_of_speech=$(echo $part_of_speech_file | cut -d. -f1 | awk '{print toupper(substr($0,1,1)) substr($0,2,length($0)-2)}')
	# part_of_speech = Noun

	echo "transforming unix/$unix_file => $part_of_speech_file"
	cat unix/$unix_file | node to_csv.mjs $part_of_speech > csv/$part_of_speech_file
done
