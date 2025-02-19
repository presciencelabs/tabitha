<script>
	import { PUBLIC_ONTOLOGY_API_HOST } from '$env/static/public'

	/** @type {SourceConcept} */
	export let data

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

		return (await response.json())[0] ?? DEFAULT_DATA
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
	<div role="button">
		<span class="badge badge-lg border-base-content badge-outline px-4 py-5 text-lg">
			<a class="link no-underline not-prose" href={get_ontology_url_for_link(data)} target="_blank">
				{`${data.stem}-${data.sense}`}
			</a>
		</span>
	</div>
{:then ontology_data} 
	{@const {stem, sense, level, gloss} = ontology_data}
	<div class="dropdown dropdown-hover dropdown-bottom">
		<div class="overflow-x-auto dropdown-content z-[1] text-sm p-2 shadow-xl rounded-box w-96 bg-base-200 tracking-normal">
			{gloss}
		</div>
		<div role="button">
			<span class="badge badge-lg border-base-content badge-outline px-4 py-5 text-lg {`L${level}`}">
				<a class="link no-underline not-prose" href={get_ontology_url_for_link(ontology_data)} target="_blank">
					{`${stem}-${sense}`}
				</a>
			</span>
		</div>
	</div>
{/await}
