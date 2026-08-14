
export async function load({ params: { project } }): Promise<{ project: string }> {
	return {
		project,
	}
}