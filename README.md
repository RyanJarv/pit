# pit

`pit` is a small prompt iteration tool for experimenting with how different
project prompts affect implementation results.

It treats prompts like lightweight commits. Git still tracks the actual project
files; `pit` tracks the prompt snapshots, their parent relationships, and the
git commit that resulted from each prompt when one exists.

## Try it

```bash
npm install
npm run pit -- init
npm run pit -- add "Initial project prompt" --message "Create the baseline app"
npm run pit -- list
npm run pit -- show P-0001
npm run pit -- diff P-0002
npm run pit -- record-result P-0001 --note "Generated the first working CLI"
```

## Storage

`pit` writes repo-local metadata under `.pit/`:

```text
.pit/
  prompts/
    P-0001.yaml
  head
```

Each prompt record stores the prompt text, an optional parent prompt, a short
message, timestamps, and optional result metadata such as the current git commit.
Commit `.pit/` when you want prompt history to travel with the project.
