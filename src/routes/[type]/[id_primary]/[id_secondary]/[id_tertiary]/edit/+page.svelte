<script lang="ts">
	import { PUBLIC_EDITOR_API_HOST } from '$env/static/public'
	import { Navigation, SourceEntities } from '$lib'
	import type { PageProps } from './$types'
	import Settings from '$lib/settings/Settings.svelte'
	import Sidebar from '$lib/sidebar/Sidebar.svelte'
	import Icon from '@iconify/svelte'

	let { data }: PageProps = $props()

	let phase1_text = $state(data.source.phase_1_encoding)
	let source_entities = $state(data.source.parsed_semantic_encoding)
	let noun_list = $state(data.source.noun_list)

	let is_checked = $state(false)
	let checking = $state(false)
	let check_result: CheckerResult|null = $state(null)
	let errors_and_warnings: [CheckerMessage, number][] = $state([])

	let analyzing = $state(false)

	function text_changed() {
		is_checked = false
	}

	async function check_text() {
		check_result = null
		checking = true
		const response = await fetch(`${PUBLIC_EDITOR_API_HOST}/check?text=${sanitize_input(phase1_text)}`)

		const check_response: CheckerResult = await response.json()
		check_response.tokens = check_response.tokens.flatMap(flatten_tokens)

		errors_and_warnings = check_response.tokens
			.flatMap((token, i) => token.messages.map<[CheckerMessage, number]>(msg => [msg, i]))
			.filter(([msg]) => ['error', 'warning'].includes(msg.label))

		check_result = check_response
		is_checked = true
		checking = false

		function flatten_tokens(token: CheckerToken): CheckerToken[] {
			if (token.sub_tokens.length) {
				return token.sub_tokens.flatMap(flatten_tokens)
			} else {
				return [token]
			}
		}
	}

	async function analyze_text() {
		if (!is_checked) {
			if (!confirm('The text has not been checked yet. Are you sure you want to continue?')) {
				return
			}
		}
		if (check_result && check_result.status !== 'ok') {
			if (!confirm(`The checker found some ${check_result?.status} in the text. Are you sure you want to continue?`)) {
				return
			}
		}

		check_result = null
		analyzing = true
		const response = await fetch(`/analyze?text=${sanitize_input(phase1_text)}`)
		const result = await response.json() as AnalysisResult
		source_entities = result.source_entities
		noun_list = result.noun_list
		analyzing = false
	}

	function sanitize_input(text: string) {
		return text.replaceAll('\n', ' ')
	}

	let selected_entity: PageSourceEntity|null = $state(null)
	let sidebar_open = $state(false)

	function handle_entity_selected(entity: PageSourceEntity) {
		selected_entity = entity
		sidebar_open = true
	}

	function close_sidebar() {
		selected_entity = null
		sidebar_open = false
	}
</script>

<div class="flex flex-row flex-wrap max-w-full">
	<Navigation nav_data={data.nav_data} url_end="/edit" />

	<button onclick={ check_text } onchange={ text_changed } class="btn btn-primary ml-8" type="submit" disabled={checking}>
		Check
		{#if checking}
			<Icon icon="line-md:loading-twotone-loop" class="h-6 w-6" />
		{:else if is_checked && check_result?.status === 'ok'}
			<Icon icon="mdi:check-bold" class="h-6 w-6" />
		{:else}
			<Icon icon="mdi:format-list-checks" class="h-6 w-6" />
		{/if}
	</button>

	<button onclick={ analyze_text } class="btn btn-secondary ml-4" type="submit" disabled={analyzing}>
		Analyze
		{#if analyzing}
			<Icon icon="line-md:loading-twotone-loop" class="h-6 w-6" />
		{:else}
			<Icon icon="mdi:magnify" class="h-6 w-6" />
		{/if}
	</button>

	<div class="ml-4">
		<Settings />
	</div>
</div>

<div class="divider my-2"></div>
<div>
	<p class="label">Input Text</p>
	<p>
		<textarea bind:value={phase1_text} rows="3" class="textarea textarea-bordered textarea-lg w-4/5"></textarea>
	</p>
</div>

{#if check_result && errors_and_warnings.length}
	<div class="divider my-2"></div>
	<div>
		<p>
			{#each check_result.tokens as token, i}
				{@const msg = errors_and_warnings.find(([, token_index]) => i === token_index)?.[0]}
				{#if msg?.label === 'error'}
					<span class="text-error">{token.token}&nbsp;</span>
				{:else if msg?.label === 'warning'}
					<span class="text-warning">{token.token}&nbsp;</span>
				{:else}
					<span>{token.token}&nbsp;</span>
				{/if}
			{/each}
		</p>
	</div>

	<div>
		{#each errors_and_warnings as [message, token_index]}
			{@const is_error = message.label === 'error'}
			{@const token = check_result.tokens[token_index]}
			<div class="alert {is_error ? 'alert-error' : 'alert-warning'} shadow-lg my-2">
				<div>
					<Icon icon={is_error ? 'mdi:close-circle' : 'mdi:alert-circle'} class="h-6 w-6" />
					<span>{message.message} <sup>(token: "{token.token}")</sup></span>
				</div>
			</div>
		{/each}
	</div>
{/if}

{#if !analyzing}
	<div class="divider my-2"></div>
	<div class="flex h-screen">
		<div class="transition-all duration-300 flex-[1_1_auto]" style="margin-right: {sidebar_open ? '24rem' : '0'};">
			<SourceEntities {source_entities} {selected_entity} {handle_entity_selected} />
		</div>
		{#if sidebar_open}
			<Sidebar bind:selected_entity={selected_entity} is_open={sidebar_open} {close_sidebar} {noun_list} enable_edit={true} />
		{/if}
	</div>
{/if}
