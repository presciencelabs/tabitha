// VS Code's Git extension hides any worktree whose folder name starts with one of these
// prefixes from the Source Control panel while the parent repo is open, assuming GitHub
// Copilot created it (isCopilotWorktreeFolder in microsoft/vscode extensions/git/src/util.ts).
const VSCODE_HIDDEN_WORKTREE_PREFIXES = ['copilot-', 'agents-'] as const

type EnterWorktreeHookInput = {
	readonly tool_input?: { readonly name?: string }
}

const find_hidden_prefix = (worktree_name: string): string | undefined => {
	const folder_name = worktree_name.split('/').at(-1) ?? ''
	return VSCODE_HIDDEN_WORKTREE_PREFIXES.find(prefix => folder_name.startsWith(prefix))
}

const hook_input: EnterWorktreeHookInput = JSON.parse(await Bun.stdin.text())
const worktree_name = hook_input.tool_input?.name
const hidden_prefix = worktree_name ? find_hidden_prefix(worktree_name) : undefined

if (hidden_prefix) {
	process.stderr.write(
		`Worktree name "${worktree_name}" starts with "${hidden_prefix}", which VS Code hides from the `
		+ 'Source Control panel. Pick a name with the scope later instead (e.g. "fix-copilot-..."). '
		+ 'See AGENTS.md "Worktree naming".\n',
	)
	process.exit(2)
}
