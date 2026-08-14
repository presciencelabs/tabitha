class EntityClipboard {
	copied_entities: PageSourceEntity[] | null = $state.raw(null)

	has_value() {
		return !!this.copied_entities
	}

	copy(entities: PageSourceEntity[]) {
		this.copied_entities = $state.snapshot(entities)
	}

	paste() {
		const value = this.copied_entities
		this.copied_entities = null
		return value
	}
}


export const entity_clipboard = new EntityClipboard()