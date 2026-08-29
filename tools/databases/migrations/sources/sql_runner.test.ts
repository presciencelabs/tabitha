import { describe, expect, it } from 'bun:test'
import Database from 'bun:sqlite'
import { bun_sqlite_runner, collecting_sql_runner, render_sql_file } from './sql_runner'

describe('bun_sqlite_runner', () => {
	it('executes statements immediately against the given database', () => {
		const db = new Database(':memory:')
		db.run('CREATE TABLE t (name TEXT)')

		const runner = bun_sqlite_runner(db)
		runner.run('INSERT INTO t (name) VALUES (?)', ['a'])
		runner.run('INSERT INTO t (name) VALUES (?)', ['b'])

		expect(db.query('SELECT name FROM t ORDER BY name').all()).toEqual([{ name: 'a' }, { name: 'b' }])
	})
})

describe('collecting_sql_runner', () => {
	it('records statements without executing them', () => {
		const runner = collecting_sql_runner()

		runner.run('UPDATE t SET name = ? WHERE id = ?', ['a', 1])
		runner.run('DELETE FROM t')

		expect(runner.statements).toEqual([
			{ sql: 'UPDATE t SET name = ? WHERE id = ?', params: ['a', 1] },
			{ sql: 'DELETE FROM t', params: [] },
		])
	})
})

describe('render_sql_file', () => {
	it('substitutes ? placeholders with literal values in order', () => {
		const sql = render_sql_file([
			{ sql: 'UPDATE Sources SET status = ? WHERE id_primary = ? AND id_secondary = ?', params: ['Ready to Translate', 'Genesis', 1] },
		])

		expect(sql).toBe("UPDATE Sources SET status = 'Ready to Translate' WHERE id_primary = 'Genesis' AND id_secondary = 1;")
	})

	it('escapes embedded single quotes in string literals', () => {
		const sql = render_sql_file([{ sql: 'UPDATE t SET name = ?', params: ["O'Brien"] }])

		expect(sql).toBe("UPDATE t SET name = 'O''Brien';")
	})

	it('joins multiple statements on separate lines', () => {
		const sql = render_sql_file([
			{ sql: 'DELETE FROM t', params: [] },
			{ sql: 'INSERT INTO t (name) VALUES (?)', params: ['a'] },
		])

		expect(sql).toBe("DELETE FROM t;\nINSERT INTO t (name) VALUES ('a');")
	})

	it('renders correctly and applies cleanly when actually executed against sqlite', () => {
		const db = new Database(':memory:')
		db.run('CREATE TABLE t (name TEXT)')
		db.run("INSERT INTO t (name) VALUES ('O''Brien')")

		const sql = render_sql_file([{ sql: 'UPDATE t SET name = ? WHERE name = ?', params: ["O'Malley", "O'Brien"] }])
		db.run(sql)

		expect(db.query('SELECT name FROM t').all()).toEqual([{ name: "O'Malley" }])
	})
})
