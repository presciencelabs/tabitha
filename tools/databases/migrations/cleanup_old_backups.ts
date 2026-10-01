// Deletes superseded Ontology backups from the db-backups R2 bucket. backup/index.ts uploads one
// object per Ontology version (re-running on an unchanged version overwrites the same key), and
// nothing ever deleted the ones a newer version replaced -- the R2 counterpart of
// cleanup_unused_d1.ts. Every object left in the bucket is listed on ontology's public /downloads
// page (apps/ontology/src/routes/downloads/+page.server.ts), so this is also what that page shows.
//
// Retention: mirrors cleanup_unused_d1.ts -- the current backup plus the single previous one as a
// rollback copy, ranked by upload time (the same order /downloads sorts by). Everything older is
// deleted. Keys that don't look like an Ontology backup are never touched.
//
// wrangler has no `r2 object list` command, so listing goes through the Cloudflare REST API;
// deletes still use wrangler, like backup/index.ts's upload.

import { $ } from 'bun'
import { create_logger } from './log'

const log = create_logger('Backup Cleanup')
const dry_run = process.argv.includes('--dry-run')

const BUCKET = 'db-backups'
const BACKUPS_TO_KEEP = 2
const BACKUP_KEY = /^Ontology[._].+\.tabitha\.sqlite$/

type R2ObjectInfo = {
	key: string
	last_modified: string
}

type ListObjectsResponse = {
	success: boolean
	errors: { message: string }[]
	result: R2ObjectInfo[]
	result_info?: { cursor?: string, is_truncated?: boolean }
}

async function list_bucket_objects(): Promise<R2ObjectInfo[]> {
	const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } = process.env
	if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
		throw 'CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must be set.'
	}

	const objects: R2ObjectInfo[] = []
	let cursor: string | undefined
	do {
		const url = new URL(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${BUCKET}/objects`)
		if (cursor) url.searchParams.set('cursor', cursor)

		const response = await fetch(url, { headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}` } })
		const body = await response.json() as ListObjectsResponse
		if (!body.success) {
			throw `Listing ${BUCKET} failed: ${body.errors.map(e => e.message).join('; ')}`
		}

		objects.push(...body.result)
		cursor = body.result_info?.is_truncated ? body.result_info.cursor : undefined
	} while (cursor)

	return objects
}

const objects = await list_bucket_objects()

const backups = objects.filter(object => {
	const is_backup = BACKUP_KEY.test(object.key)
	if (!is_backup) log.info(`keep (not an Ontology backup): ${object.key}`)
	return is_backup
})

const newest_first = backups.toSorted((a, b) => b.last_modified.localeCompare(a.last_modified))
const to_keep = newest_first.slice(0, BACKUPS_TO_KEEP)
const to_delete = newest_first.slice(BACKUPS_TO_KEEP)

const [current, ...rollback_copies] = to_keep
if (current) log.info(`keep (current): ${current.key}`)
for (const backup of rollback_copies) log.info(`keep (rollback copy): ${backup.key}`)

for (const backup of to_delete) {
	if (dry_run) {
		log.step(`[dry run] Would delete ${backup.key} (uploaded ${backup.last_modified})`)
	} else {
		log.step(`Deleting ${backup.key} (uploaded ${backup.last_modified})...`)
		await $`wrangler r2 object delete ${BUCKET}/${backup.key} --remote`
	}
}

log.success(`${dry_run ? 'Would delete' : 'Deleted'} ${to_delete.length} old backup${to_delete.length === 1 ? '' : 's'} from ${BUCKET}.`)
log.summary()
