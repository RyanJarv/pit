# D-002: Use git for code history instead of duplicating version control

`pit` should not become a second source of truth for file diffs, branches, or
merge behavior.

When git is available, prompt records capture the current commit before a prompt
is applied and the resulting commit after the implementation is recorded. That
keeps prompt experimentation visible without rebuilding git.
