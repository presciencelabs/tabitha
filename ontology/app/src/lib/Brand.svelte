<hgroup>
	<h1>Ontology</h1>
	<h2>TaBiThA</h2>
</hgroup>

<style>
	/* these are meant to give the last child a "superscript" style */

	hgroup :last-child {
		font-size: smaller;

		position: relative;

		/* moves it up */
		inset-block-end: calc(var(--pico-typography-spacing-vertical) * 2.7);
	}

	html[dir=ltr] hgroup :last-child {
		/* moves it to the end (only for ltr) */
		inset-inline-start: calc(var(--pico-typography-spacing-vertical) * 5.7);
	}
</style>
