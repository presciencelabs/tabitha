
export async function is_authorized(locals: App.Locals, permission: Permission): Promise<boolean> {
	if (!locals.user) {
		return false
	}

	const sql = `
		SELECT true AS found
		FROM User_Permissions up
		JOIN Permissions p ON up.permission_id = p.id
		WHERE p.app = ? AND up.user_email = ? AND p.permission = ?
	`
	const found = await locals.db_auth.prepare(sql).bind('ontology', locals.user.email, permission).first<boolean>('found') || false
	return found
}