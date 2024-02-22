<script>
	/** @type {SourceData['phase_2_encoding']}*/
	export let phase_2_encoding

	const ENTITY_LABELS = new Map([
		['c', 'C'],			// Clauses
		['n', 'NP'],		// Noun Phrases
		['N', 'N'],			// Nouns
		['v', 'VP'],		// Verb Phrases
		['V', 'V'],			// Verbs
		['j', 'AdjP'],		// Adjective Phrases
		['A', 'Adj'],		// Adjectives
		['d', 'AdvP'],		// Adverb Phrases
		['a', 'Adv'],		// Adverbs
		['P', 'Adp'],		// Adpositions
		['C', 'Con'],		// Conjunctions
		['r', 'Par'],		// Particles
		['p', 'Phr'],		// Phrasals
		['.', 'period'],	// Period
	])

	const ENTITIES_WITH_SENSE = new Set(['N', 'V', 'A', 'a', 'P', 'C', 'r', 'p'])

	/**
	 * TODO move to the sources repo
	 *
	 * The phase_2_encoding looks something like:
	 * ~\wd ~\tg c-IDp00NNNNNNNNNNNNN.............~\lu {~\wd ~\tg C-1A.....~\lu then~\wd ~\tg n-SAN.N........~\lu (...
	 *
	 * If present, the first character of the features indicates the 'entity' type.
	 * This could be a clause/phrase boundary, part of speech, or even certain punctuation.
	 *
	 * '{' and '}' indicate a main clause boundary
	 * '[' and ']' indicate a subordinate clause boundary
	 * '(' and ')' indicate a phrase boundary
	 *
	 * Examples:
	 * ~\wd ~\tg c-IDp00NNNNNNNNNNNNN.............~\lu {    => { label: 'C', features: C-IDp00NNNNNNNNNNNNN.............', entity: '{' }
	 * ~\wd ~\tg N-1A1SDAnK3NN........~\lu God  => { label: 'N', features: 'N-1A1SDAnK3NN........', entity: 'God' }
	 * ~\wd ~\tg v-S.....~\lu (     => { label: 'VP', features: 'VP-S.....', entity: '(' }
	 * ~\wd ~\tg C-1A.....~\lu then => { label: 'Con', features: 'Con-1A.....', entity: 'then' }
	 * ~\wd ~\tg ~\lu )             => { label: '', features: '', entity: ')' }
	 * ~\wd ~\tg .-~\lu .           => { label: 'period', features: 'period-', entity: '.' }
	 *
	 * @param {string} semantic_encoding
	 *
	 * @returns {SemanticEncoding}
	 */
	function transform_semantic_encoding(semantic_encoding) {
		let entities = [...semantic_encoding.matchAll(/~\\wd ~\\tg ([^~]*)~\\lu ([^~]+)/g)]

		return entities.map(decode_entity)

		/**
		 * @param {RegExpMatchArray} entity_match ['~\wd ~\tg N-1A1SDAnK3NN........~\lu God', 'N-1A1SDAnK3NN........', 'God']
		 *
		 * @returns {SourceEntity}
		 */
		function decode_entity(entity_match) {
			let features = entity_match[1]
			const entity = entity_match[2]
			let label = ''
			let sense = ''

			// replace the first character of the features with the more descriptive label
			if (features.length > 0) {
				const entity_type = features[0]
				label = ENTITY_LABELS.get(entity_type) || ''

				// Add the sense to the word if appropriate
				if (ENTITIES_WITH_SENSE.has(entity_type)) {
					sense = features[3]
				}

				features = label + features.slice(1)	   // This is how TBTA displays it
			}

			return {
				label,
				features,
				sense,
				entity,
			}
		}
	}

	/**
	 * This is just a temporary display solution.
	 *
	 * @param {SourceEntity} entity
	 *
	 * @returns {string} a simplified rendering of the entity
	 */
	function simple_display(entity) {
		if (['{', '(', '['].includes(entity.entity)) {
			return `[${entity.label}`

		} else if (['}', ')', ']'].includes(entity.entity)) {
			return ']'

		} else if (entity.label === 'period') {
			return entity.entity

		} else if (entity.sense !== 'A') {
			return `${entity.entity}-${entity.sense}(${entity.label})`

		} else {
			return `${entity.entity}(${entity.label})`
		}
	}

	$: simple_encoding = transform_semantic_encoding(phase_2_encoding).map(simple_display).join(' ')

</script>

<h4 class="flex justify-between">
	Semantic encoding (Phase 2)
</h4>
<p>
	<!--TODO display clause/phrase boundaries differently, and show (some?) features on hover -->
	{simple_encoding}
</p>
