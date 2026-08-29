import { json } from '@sveltejs/kit'
import { TARGET_PROJECTS } from '@tabitha/types/target'

export function GET() {
	return json(TARGET_PROJECTS)
}
