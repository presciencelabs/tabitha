/**
 * @param {import('@cloudflare/workers-types').D1Database} db
 * @returns {Promise<SourceType[]>}
 */
export async function get_types(db) {
	const sql = `
		SELECT DISTINCT type
		FROM Sources
	`

	/** @type {import('@cloudflare/workers-types').D1Result<SourceType>} https://developers.cloudflare.com/d1/platform/client-api/#return-object */
	const { results } = await db.prepare(sql).all()
	return results
}

/**
 * @param {import('@cloudflare/workers-types').D1Database} db
 * @param {string} type
 * @returns {Promise<PrimaryId[]>}
 */
export async function get_primary_ids(db, type) {
	const sql = `
		SELECT DISTINCT id_primary
		FROM Sources
		WHERE type LIKE ?
	`

	/** @type {import('@cloudflare/workers-types').D1Result<PrimaryId>} https://developers.cloudflare.com/d1/platform/client-api/#return-object */
	const { results } = await db.prepare(sql).bind(type).all()
	return results
}

/**
 * @param {import('@cloudflare/workers-types').D1Database} db
 * @param {string} type
 * @param {string} id_primary
 * @returns {Promise<SecondaryId[]>}
 */
export async function get_secondary_ids(db, type, id_primary) {
	const sql = `
		SELECT DISTINCT id_secondary
		FROM Sources
		WHERE type LIKE ?
			AND id_primary LIKE ?
	`

	/** @type {import('@cloudflare/workers-types').D1Result<SecondaryId>} https://developers.cloudflare.com/d1/platform/client-api/#return-object */
	const { results } = await db.prepare(sql).bind(type, id_primary).all()
	return results
}

/**
 * @param {import('@cloudflare/workers-types').D1Database} db
 * @param {string} type
 * @param {string} id_primary
 * @param {string} id_secondary
 * @returns {Promise<TertiaryId[]>}
 */
export async function get_tertiary_ids(db, type, id_primary, id_secondary) {
	const sql = `
		SELECT DISTINCT id_tertiary
		FROM Sources
		WHERE type LIKE ?
			AND id_primary LIKE ?
			AND id_secondary = ?
	`

	/** @type {import('@cloudflare/workers-types').D1Result<TertiaryId>} https://developers.cloudflare.com/d1/platform/client-api/#return-object */
	const { results } = await db.prepare(sql).bind(type, id_primary, id_secondary).all()
	return results
}

/**
 * @param {import('@cloudflare/workers-types').D1Database} db 
 * @param {Reference} reference 
 * @returns {Promise<Source|null>}
 */
export async function get_source_data(db, { type, id_primary, id_secondary, id_tertiary }) {
	const sql = `
		SELECT *
		FROM Sources
		WHERE type LIKE ?
			AND id_primary LIKE ?
			AND id_secondary = ?
			AND id_tertiary = ?
	`

	/** @type {Source|null} */
	const result = await db.prepare(sql).bind(type, id_primary, id_secondary, id_tertiary).first()
	return result
}