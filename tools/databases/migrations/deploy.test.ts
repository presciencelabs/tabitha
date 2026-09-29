import { describe, expect, it } from 'bun:test'
import { repoint_d1_binding } from './deploy'

const CONFIG_TEXT = `{
	"name": "ontology",
	"d1_databases": [
		{
			"binding": "DB_Ontology",
			"database_name": "Ontology_9494_2026-06-25",
			"database_id": "old-ontology-id"
		},
		{
			"binding": "DB_Auth",
			"database_name": "Auth",
			"database_id": "auth-id"
		}
	],
	"env": {
		"preview": {
			// preview shares production's databases
			"d1_databases": [
				{
					"binding": "DB_Ontology",
					"database_name": "Ontology_9494_2026-06-25",
					"database_id": "old-ontology-id"
				}
			]
		}
	}
}`

const NEW_DATABASE = { name: 'Ontology_9494_2026-09-29', uuid: 'new-ontology-id' }

describe('repoint_d1_binding', () => {
	it('repoints the binding at top level and in every env', () => {
		const result = repoint_d1_binding({ config_text: CONFIG_TEXT, binding: 'DB_Ontology', database: NEW_DATABASE })

		expect(result.match(/"Ontology_9494_2026-09-29"/g)).toHaveLength(2)
		expect(result.match(/"new-ontology-id"/g)).toHaveLength(2)
		expect(result).not.toContain('Ontology_9494_2026-06-25')
		expect(result).not.toContain('old-ontology-id')
	})

	it('leaves other bindings and comments untouched', () => {
		const result = repoint_d1_binding({ config_text: CONFIG_TEXT, binding: 'DB_Ontology', database: NEW_DATABASE })

		expect(result).toContain('"database_name": "Auth",\n\t\t\t"database_id": "auth-id"')
		expect(result).toContain('// preview shares production\'s databases')
	})

	it('does not match a binding that only shares a prefix', () => {
		const config_text = CONFIG_TEXT.replaceAll('"DB_Ontology"', '"DB_Ontology_Archive"')

		expect(() => repoint_d1_binding({ config_text, binding: 'DB_Ontology', database: NEW_DATABASE })).toThrow(/No d1_databases entry with binding "DB_Ontology"/)
	})

	it('throws when the binding is missing', () => {
		expect(() => repoint_d1_binding({ config_text: CONFIG_TEXT, binding: 'DB_Sources', database: NEW_DATABASE })).toThrow(/No d1_databases entry with binding "DB_Sources"/)
	})
})
