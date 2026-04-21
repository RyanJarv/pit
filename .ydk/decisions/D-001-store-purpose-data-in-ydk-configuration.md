# D-001: Store prompt data in repo-local .pit metadata

`pit` keeps prompt snapshots under `.pit/` so experiments travel with the
project being generated or modified.

Git remains responsible for file history. `pit` stores the smaller prompt-level
history that explains what input was used and what git state it produced.
