# D-003: Use YAML records for prompt snapshots

Prompt records should be easy to inspect, edit, and review by hand while the
tool is still experimental.

YAML keeps the storage format close to the prompt-writing workflow. If the model
stabilizes later, `pit` can add stricter schemas or a separate runs directory
without changing the first interaction.
