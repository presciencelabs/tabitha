<script lang="ts">
	let { data } = $props()

	const STATUS_COLOR: Record<string, string> = {
		'Ready to Translate': 'var(--teal)',
		'Final Review in Progress': 'var(--teal-mid-1)',
		'Initial Analysis Complete': 'var(--teal-mid-2)',
		'Initial Analysis in Progress': 'var(--teal-soft)',
		'Not Started': 'var(--rule)',
	}

	let ready_count = $derived(data.status_counts.find(s => s.status === 'Ready to Translate')?.count ?? 0)
</script>

<a href="/" class="back-link">← Home</a>

<div class="page-kicker">The project</div>
<h1>Remaining work</h1>
<p class="page-dek">
	No system like this is ever finished — it grows one book, one feature, one target language at a
	time. Here's where things actually stand.
</p>

<div class="page-body">
	<p>
		Every book of Scripture moves through the same stages before a translation team can use it:
		its meaning gets analyzed into a semantic representation, that analysis goes through review,
		and once it's solid, the book is ready to generate a working translation from. The panel
		below reflects that pipeline as it stands today, pulled live from the same database the team
		works from.
	</p>

	{#if data.total_books > 0}
		<div class="progress-panel">
			<div class="progress-headline">
				<span class="progress-figure">{ready_count}</span>
				<span class="progress-unit">of {data.total_books} books ready to translate</span>
			</div>
			<div
				class="progress-bar"
				role="img"
				aria-label="{data.status_counts.map(s => `${s.count} ${s.status}`).join(', ')}"
			>
				{#each data.status_counts.filter(s => s.count > 0) as { status, count }}
					<div
						class="progress-segment"
						style="width: {count / data.total_books * 100}%; background: {STATUS_COLOR[status]};"
					></div>
				{/each}
			</div>
			<ul class="progress-legend">
				{#each data.status_counts as { status, count }}
					<li>
						<span class="legend-swatch" style="background: {STATUS_COLOR[status]};"></span>
						{status} — {count}
					</li>
				{/each}
			</ul>
		</div>
	{:else}
		<p class="progress-empty">Live status is temporarily unavailable — check back shortly.</p>
	{/if}

	<a href="https://sources.tabitha.bible/lookup/status/Bible" class="progress-detail-link">
		See status book-by-book →
	</a>

	<h2>Beyond Scripture coverage</h2>
	<p>
		Full Bible coverage is the near-term goal, but it isn't the whole of "remaining work." Every
		new target language needs its own lexicon and grammar rules built out, and the tools
		translation teams use day to day — the editor, the review workflow, the AI assistance layered
		on top — keep getting refined as real teams put them to use. None of that shows up in a status
		bar, but it's just as much a part of what's left to build.
	</p>
</div>

<nav class="page-siblings">
	<a href="/about">About →</a>
	<a href="/faqs">FAQs →</a>
</nav>
