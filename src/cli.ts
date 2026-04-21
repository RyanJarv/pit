#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import YAML from "yaml";
import { currentGitCommit, isGitRepository } from "./git.js";
import {
  initStore,
  listPrompts,
  nextPromptId,
  readHead,
  readPrompt,
  savePrompt,
  writeHead,
} from "./store.js";
import type { PromptId, PromptRecord } from "./types.js";

async function main(argv: string[]): Promise<void> {
  const [command, ...args] = argv;

  switch (command) {
    case "init":
      await initStore();
      console.log("initialized .pit");
      return;
    case "add":
      await addPrompt(args);
      return;
    case "list":
      await listPromptRecords();
      return;
    case "show":
      await showPrompt(args);
      return;
    case "checkout":
      await checkoutPrompt(args);
      return;
    case "record-result":
      await recordResult(args);
      return;
    case "help":
    case undefined:
      printHelp();
      return;
    default:
      throw new Error(`unknown command: ${command}`);
  }
}

async function addPrompt(args: string[]): Promise<void> {
  const options = parseOptions(args);
  const promptArg = options.positionals[0];
  const prompt = options.file
    ? await readFile(String(options.file), "utf8")
    : promptArg;

  if (!prompt) {
    throw new Error("add requires prompt text or --file <path>");
  }

  const id = await nextPromptId();
  const parent = (options.parent as PromptId | undefined) ?? (await readHead());
  const record: PromptRecord = {
    id,
    message: String(options.message ?? firstLine(prompt)),
    prompt,
    parent,
    createdAt: new Date().toISOString(),
    git: {
      baseCommit: isGitRepository() ? currentGitCommit() : undefined,
    },
  };

  await savePrompt(record);
  console.log(`${id} ${record.message}`);
}

async function listPromptRecords(): Promise<void> {
  const head = await readHead();
  const records = await listPrompts();
  for (const record of records) {
    const marker = record.id === head ? "*" : " ";
    const result = record.git?.resultCommit
      ? ` result=${record.git.resultCommit.slice(0, 12)}`
      : "";
    console.log(`${marker} ${record.id} ${record.message}${result}`);
  }
}

async function showPrompt(args: string[]): Promise<void> {
  const id = await requirePromptId(args[0]);
  const record = await readPrompt(id);
  console.log(YAML.stringify(record));
}

async function checkoutPrompt(args: string[]): Promise<void> {
  const id = await requirePromptId(args[0]);
  await readPrompt(id);
  await writeHead(id);
  console.log(`HEAD -> ${id}`);
}

async function recordResult(args: string[]): Promise<void> {
  const options = parseOptions(args);
  const id = await requirePromptId(options.positionals[0]);
  const record = await readPrompt(id);
  record.git = {
    ...record.git,
    resultCommit: isGitRepository() ? currentGitCommit() : undefined,
  };
  record.result = {
    note: options.note ? String(options.note) : undefined,
    recordedAt: new Date().toISOString(),
  };
  await savePrompt(record);
  console.log(`recorded result for ${id}`);
}

async function requirePromptId(value: string | undefined): Promise<PromptId> {
  const id = (value as PromptId | undefined) ?? (await readHead());
  if (!id) {
    throw new Error("prompt id required");
  }
  return id;
}

function parseOptions(args: string[]): Record<string, string | string[]> & {
  positionals: string[];
} {
  const options: Record<string, string | string[]> & { positionals: string[] } = {
    positionals: [],
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg) {
      continue;
    }
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`missing value for --${key}`);
      }
      options[key] = value;
      index += 1;
    } else {
      options.positionals.push(arg);
    }
  }

  return options;
}

function firstLine(value: string): string {
  return value.trim().split(/\r?\n/, 1)[0] || "Untitled prompt";
}

function printHelp(): void {
  console.log(`pit

Commands:
  pit init
  pit add <prompt> [--message <text>] [--parent <id>]
  pit add --file <path> [--message <text>] [--parent <id>]
  pit list
  pit show [id]
  pit checkout <id>
  pit record-result [id] [--note <text>]
`);
}

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

