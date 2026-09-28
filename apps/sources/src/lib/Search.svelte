
<!-- https://developer.mozilla.org/en-US/docs/Web/HTML/Element/search -->
<search>
	<!--
		used role="search" ∵ https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/search#search_form_labels_and_accessibility.
	-->
	<form role="search" class="join w-full" action="/search">
		<input type="search" name="q" id="search_query" placeholder="Reference or Phase 1 words" class="input input-primary input-lg w-full join-item" />

		<button type="submit" class="btn btn-primary btn-lg join-item">
			<span class="hidden sm:inline">Search</span>
		</button>
	</form>
</search>
