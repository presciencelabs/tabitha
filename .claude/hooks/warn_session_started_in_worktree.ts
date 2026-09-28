// A new session inherits whatever directory it was launched from -- including a worktree that
// another session entered with EnterWorktree. Such a session would otherwise treat that worktree
// as its own isolated copy and edit alongside (or after the removal of) its real owner.
const WORKTREES_SEGMENT = '/.claude/worktrees/'

type SessionStartHookInput = {
	readonly cwd?: string
}

const find_worktree_name = (cwd: string): string | undefined => {
	const normalized_cwd = cwd.replaceAll('\\', '/')
	const segment_index = normalized_cwd.indexOf(WORKTREES_SEGMENT)
	if (segment_index === -1) return undefined

	return normalized_cwd.slice(segment_index + WORKTREES_SEGMENT.length).split('/')[0]
}

const hook_input: SessionStartHookInput = JSON.parse(await Bun.stdin.text())
const worktree_name = hook_input.cwd ? find_worktree_name(hook_input.cwd) : undefined

if (worktree_name) {
	process.stdout.write(JSON.stringify({
		systemMessage: `⚠️ This session started inside worktree "${worktree_name}", which likely belongs to another session.`,
		hookSpecificOutput: {
			hookEventName: 'SessionStart',
			additionalContext: `This session was launched with its working directory inside the git worktree `
				+ `".claude/worktrees/${worktree_name}", which was most likely created by a different Claude `
				+ 'session and is not yours: do not edit files, commit, or stash there, and do not treat it as '
				+ 'already-isolated. Run read-only commands from the main checkout (the directory containing '
				+ '.claude/worktrees/), and call EnterWorktree to create your own worktree before any edits. '
				+ 'Only continue in this worktree if the user explicitly says it is this session\'s to use.',
		},
	}))
}
