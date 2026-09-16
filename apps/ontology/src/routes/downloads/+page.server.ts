import type { R2Object, R2Objects } from '@cloudflare/workers-types'
import type { PageServerLoad } from './$types'
import { get_version } from '$lib/server/ontology'

type Backup = {
	name: string,
	size_mb: number,
	created_at: Date,
	url: string,
	version: string,
}

export async function load({ locals: { db_ontology }, platform }: Parameters<PageServerLoad>[0]) {
	console.info('checking for downloads...')

	// https://developers.cloudflare.com/r2/api/workers/workers-api-reference/#bucket-method-definitions
	const { objects }: R2Objects = await platform!.env.R2_db_backups.list()

	if (!objects) {
		return { backups: [], pending: true }
	}

	const backups = objects.map(transform).toSorted(most_recent_first)

	const current_version = await get_version(db_ontology)
	const most_recent_backup_version = backups[0]?.version
	const pending = current_version !== most_recent_backup_version

	return {
		backups,
		pending,
	}

	function transform(obj: R2Object): Backup {
		return {
			name: obj.key,
			size_mb: bytes_to_mb(obj.size),
			created_at: new Date(obj.uploaded),
			url: `https://db-backups.tabitha.bible/${obj.key}`,
			version: obj.key.split(/[._]/)[1],
		}
	}

	function bytes_to_mb(bytes: number) {
		return Math.round(bytes / (1024 * 1024))
	}

	function most_recent_first(a: Backup, b: Backup) {
		return b.created_at.getTime() - a.created_at.getTime()
	}
}
