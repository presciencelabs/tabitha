<a href="/" class="back-link">← Home</a>

<div class="page-kicker">The project</div>
<h1>FAQs</h1>
<p class="page-dek">The questions that come up most, from translation teams and engineers alike.</p>

<div class="page-body">
	<h2>Why rule-based, and not a neural model?</h2>
	<p>
		Neural translation needs a large body of parallel text to train on, and for most of the
		world's minority languages that simply doesn't exist. Rule-based generation doesn't need a
		training corpus — it needs a linguist to describe how the language actually works, once. That
		description is also useful on its own: it's a real, checkable grammar of the language, not a
		black box.
	</p>

	<h2>Where does the source material come from?</h2>
	<p>
		The starting point is the Greek New Testament and Hebrew Old Testament, read alongside
		established lexicons, and encoded into a shared semantic representation built specifically for
		this project — one designed to hold onto meaning precisely enough to regenerate it in a very
		different language, and expressive enough to cover the range of content across both
		testaments.
	</p>

	<h2>How is this different from a general translation tool?</h2>
	<p>
		A general-purpose translator predicts likely words in the target language from patterns in
		training data. This works the other way around: a person first builds a detailed semantic
		representation of what the text actually means — its participants, its structure, the
		distinctions the source language marks — and the software then generates a draft from that
		representation using the target language's own grammar rules. A native speaker takes it from
		there.
	</p>

	<h2>How much of the Bible can it translate?</h2>
	<p>
		Any passage that has a semantic representation built for it. Coverage is expanding toward the
		full Bible; see <a href="/remaining-work">Remaining work</a> for where that stands today.
	</p>

	<h2>What about poetry?</h2>
	<p>
		Meter and rhyme rarely survive translation intact, so the priority is meaning over form: the
		parallelism that carries so much of Hebrew poetry is preserved deliberately, and metaphors are
		handled contextually — sometimes as a simile instead, when that's what actually lands in the
		target language.
	</p>

	<h2>What does it take to set up a new language?</h2>
	<p>
		Roughly 40–50 hours to get comfortable with the software itself, then another 150–200 hours to
		configure a new target language's grammar and produce a first sample book. A background in
		linguistics or software helps, but neither is required — see
		<a href="/how-it-works">How does it work?</a> for what that setup actually involves.
	</p>
</div>

<nav class="page-siblings">
	<a href="/remaining-work">Remaining work →</a>
	<a href="/about">About →</a>
</nav>
