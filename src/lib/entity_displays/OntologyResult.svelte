<script>
	import { PUBLIC_ONTOLOGY_API_HOST } from '$env/static/public'

	/** @type {SourceConcept} */
	export let data
	export let classes=''

	/**
	 * @param {SourceConcept} concept
	 * @returns {Promise<OntologyResult>}
	 */
	async function fetch_ontology_data(concept) {
		const { stem, sense, part_of_speech } = concept
		const response = await fetch(`${PUBLIC_ONTOLOGY_API_HOST}/search?q=${stem}-${sense}&category=${part_of_speech}`)

		const DEFAULT_DATA = {
			...concept,
			level: '',
			gloss: '',
		}

		if (!response.ok) {
			return DEFAULT_DATA
		}

		/** @type {OntologyResult[]} */
		const results = await response.json()
		
		// Use the result that exactly matches the original stem (eg. "lot" vs "Lot")
		return results.find(result => result.stem === stem) ?? DEFAULT_DATA
	}

	/**
	 * @param {SourceConcept} concept
	 * @returns {string} fully-qualified URL to the ontology API
	 */
	function get_ontology_url_for_link({ stem, part_of_speech }) {
		return `${PUBLIC_ONTOLOGY_API_HOST}/?q=${stem}&category=${part_of_speech}`
	}
</script>

{#await fetch_ontology_data(data)}
	<span class="badge badge-lg border-base-content badge-outline px-2 py-4 text-md {classes}">
		<a class="link no-underline not-prose" href={get_ontology_url_for_link(data)} target="_blank">
			{`${data.stem}-${data.sense}`}
		</a>
	</span>
{:then ontology_data}
	{@const { stem, sense, level, gloss } = ontology_data}
	<div class="dropdown dropdown-hover dropdown-bottom">
		<div class="overflow-x-auto dropdown-content z-[1] text-sm p-2 shadow-xl rounded-box w-96 bg-base-200 tracking-normal">
			{gloss}
		</div>
		<div role="button">
			<span class="badge badge-lg border-base-content badge-outline px-2 py-4 text-md {`L${level}`} {classes}">
				<a class="link no-underline not-prose" href={get_ontology_url_for_link(ontology_data)} target="_blank">
					{`${stem}-${sense}`}
				</a>
			</span>
		</div>

		<!--This empty div makes join-item, if present, behave as desired-->
		<div class="join-item"></div>
	</div>
{/await}
