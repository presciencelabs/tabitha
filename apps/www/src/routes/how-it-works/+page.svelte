<a href="/" class="back-link">← Home</a>

<div class="page-kicker">For translators</div>
<h1>How does it work?</h1>
<p class="page-dek">
	Five layers stand between a source text and a working draft in your language — each one built to
	hold onto meaning, not just words.
</p>

<div class="model-diagram" aria-hidden="true">
	<svg viewBox="0 0 700 480" role="img" aria-labelledby="model-diagram-title">
		<title id="model-diagram-title"
			>Ontology and Semantic Representation feed Transfer Grammar, which feeds Synthesizing Grammar
			alongside the Lexicon and Lexical Grammar, producing the Target Text.</title
		>
		<style>
			.diagram-label {
				font-family: var(--font-sans);
				font-size: 16px;
				fill: var(--ink);
			}
			.diagram-label-small {
				font-family: var(--font-sans);
				font-size: 12px;
				fill: var(--ink-soft);
			}
			.diagram-label-strong {
				font-family: var(--font-serif);
				font-size: 21px;
				font-weight: 600;
				fill: var(--ink);
			}
		</style>
		<defs>
			<marker
				id="model-arrow"
				viewBox="0 0 10 10"
				refX="8"
				refY="5"
				markerWidth="6"
				markerHeight="6"
				orient="auto-start-reverse"
			>
				<path d="M0,0 L10,5 L0,10 z" fill="var(--ink-soft)" />
			</marker>
		</defs>

		<line x1="152" y1="168" x2="197" y2="182" stroke="var(--ink-soft)" stroke-width="1.5" />
		<line
			x1="345"
			y1="115"
			x2="325"
			y2="178"
			stroke="var(--ink-soft)"
			stroke-width="1.5"
			marker-end="url(#model-arrow)"
		/>
		<line
			x1="320"
			y1="250"
			x2="320"
			y2="328"
			stroke="var(--ink-soft)"
			stroke-width="1.5"
			marker-end="url(#model-arrow)"
		/>
		<line x1="470" y1="215" x2="558" y2="255" stroke="var(--ink-soft)" stroke-width="1.5" />
		<line x1="470" y1="365" x2="558" y2="325" stroke="var(--ink-soft)" stroke-width="1.5" />
		<line
			x1="320"
			y1="400"
			x2="320"
			y2="443"
			stroke="var(--ink-soft)"
			stroke-width="1.5"
			marker-end="url(#model-arrow)"
		/>

		<ellipse
			cx="95"
			cy="140"
			rx="80"
			ry="36"
			fill="var(--paper-raised)"
			stroke="var(--ink)"
			stroke-width="1.5"
		/>
		<text x="95" y="146" text-anchor="middle" class="diagram-label">Ontology</text>

		<ellipse
			cx="345"
			cy="70"
			rx="140"
			ry="42"
			fill="var(--paper-raised)"
			stroke="var(--ink)"
			stroke-width="1.5"
		/>
		<text x="345" y="65" text-anchor="middle" class="diagram-label">Semantic</text>
		<text x="345" y="85" text-anchor="middle" class="diagram-label">Representation</text>

		<rect
			x="170"
			y="180"
			width="300"
			height="70"
			fill="var(--paper-raised)"
			stroke="var(--ink)"
			stroke-width="1.5"
		/>
		<text x="320" y="220" text-anchor="middle" class="diagram-label">Transfer Grammar</text>

		<rect
			x="170"
			y="330"
			width="300"
			height="70"
			fill="var(--paper-raised)"
			stroke="var(--ink)"
			stroke-width="1.5"
		/>
		<text x="320" y="370" text-anchor="middle" class="diagram-label">Synthesizing Grammar</text>

		<rect
			x="560"
			y="240"
			width="120"
			height="100"
			fill="var(--teal-soft)"
			stroke="var(--teal)"
			stroke-width="1.5"
		/>
		<line x1="560" y1="288" x2="680" y2="288" stroke="var(--teal)" stroke-width="1" />
		<text x="620" y="270" text-anchor="middle" class="diagram-label">Lexicon</text>
		<text x="620" y="308" text-anchor="middle" class="diagram-label-small">Lexical</text>
		<text x="620" y="323" text-anchor="middle" class="diagram-label-small">Grammar</text>

		<text x="320" y="465" text-anchor="middle" class="diagram-label-strong">Target Text</text>
	</svg>
</div>

<div class="page-body">
	<h2>The ontology</h2>
	<p>
		At the foundation sits a set of thousands of precisely defined, semantically simple concepts —
		drawn from research into universal semantic primitives and a well-established core vocabulary.
		Every concept means exactly one thing, categorized into one of seven semantic groups, so a
		word that's ambiguous in English never gets a chance to smuggle that ambiguity downstream.
	</p>
	<p>
		<a href="https://ontology.tabitha.bible/?q=be&category=all">Try it yourself</a> — search "be"
		on the live Ontology and see all the distinct concepts English flattens into one word.
	</p>

	<h2>Semantic representation</h2>
	<p>
		The source text is re-expressed as simple propositions built from those concepts, richly
		annotated with the linguistic features a translator would actually need — things like number
		(a language can distinguish singular, dual, trial, or plural in ways English never marks),
		who's tracking whom across a passage, and relative proximity. Where scholars read a passage
		differently, the representation can hold more than one reading.
	</p>
	<p>
		<a href="https://sources.tabitha.bible/Bible/Genesis/6/8">Try it yourself</a> — see Genesis 6:8's
		full representation on the live Sources app; hover any tagged word for its features.
	</p>

	<h2>The target lexicon</h2>
	<p>
		Every word in a target language is entered once, in one of seven syntactic classes — nouns,
		verbs, adjectives, adverbs, adpositions, conjunctions, particles — along with the features and
		forms a linguist defines for that language. From there, the rules for inflection and word
		formation are handled automatically.
	</p>
	<blockquote class="example-quote">
		In Tagalog, entering the verb <em>alaga</em> ("to care") once generates its full paradigm automatically
		— <em>nag-alaga</em>, <em>nag-aalaga</em>, <em>mag-aalaga</em> for actor-focus forms, <em
			>inalagaan</em
		>, <em>inaalagaan</em> for object-focus forms — without a linguist writing out every inflected
		form by hand.
	</blockquote>

	<h2>Transfer grammar</h2>
	<p>
		This is where a semantic representation stops being language-neutral and starts becoming
		specific to your language: restructuring propositions, resolving how verbs take their
		arguments, working out relative clauses, noun relationships, and the collocations that don't
		translate word-for-word.
	</p>
	<blockquote class="example-quote">
		In Tagalog, when two adjacent noun phrases share the same possessor, a rule collapses the
		repeated possessor marker on the first noun rather than stating it twice — the way a fluent
		speaker actually says "the king's food and wine," not "the king's food and the king's wine."
	</blockquote>

	<h2>Synthesizing grammar</h2>
	<p>
		The final stage generates actual text — resolving agreement, choosing the right word for the
		context, handling affixes, setting word order, applying sound changes, and marking pronouns —
		to produce a complete draft.
	</p>
	<dl class="rule-examples">
		<dt>Word order</dt>
		<dd>
			A phrase-structure rule fixes where each kind of constituent is allowed to sit in a clause —
			in Tagalog, a post-verbal adverb ordinarily precedes a pronominal subject: <em
				>Nakakakita na ako</em
			> ("I can see now").
		</dd>

		<dt>Case affixes</dt>
		<dd>
			A single rule inserts the right case marker for a noun phrase depending on its grammatical
			role and whether it names a common or proper noun — in Tagalog, <em>ang</em> for an absolutive
			common noun, <em>si</em> for an absolutive proper noun, <em>ng</em> for an ergative common noun,
			across a table of a few dozen combinations.
		</dd>

		<dt>Tense affixes</dt>
		<dd>
			In Kewa, verb tense is marked with a suffix that depends on the subject's person and number
			as well as the tense itself — first-person singular present takes <em>-lo</em>, past <em
				>-wa</em
			>, remote past <em>-su</em>, future <em>-lua</em> — and the pattern shifts again for dual and
			plural subjects.
		</dd>

		<dt>Pronoun clitics</dt>
		<dd>
			In Kewa, a reciprocal action ("to each other") is marked with the clitic <em>-na</em> attached
			after the object noun phrase, rather than a separate word:
			<em>Nííáámé níáána bipa búkú kálama</em> ("We gave books to each other").
		</dd>

		<dt>Sound changes</dt>
		<dd>
			In Tagalog, the case marker <em>ng</em> contracts to a bound suffix <em>-ng</em> when it follows
			a vowel-final verb — <em>sinabi</em> ("said") plus <em>ng</em> becomes <em>sinabing</em>, not two
			separate words.
		</dd>
	</dl>

	<p>
		What that process looks like day to day for a translation team — and where AI assistance fits
		into it — is covered in <a href="/workflows">Workflows</a>. Or see
		<a href="/walkthrough">a real example</a> of all five layers run on a single verse.
	</p>
</div>

<nav class="page-siblings">
	<a href="/workflows">Workflows →</a>
	<a href="/walkthrough">Worked example →</a>
	<a href="/developers">For developers →</a>
</nav>
