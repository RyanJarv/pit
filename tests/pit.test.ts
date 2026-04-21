import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { chdir, cwd } from "node:process";
import { test } from "node:test";
import { promisify } from "node:util";
import {
  initStore,
  listPrompts,
  nextPromptId,
  readHead,
  savePrompt,
} from "../src/store.js";
import type { PromptRecord } from "../src/types.js";

const execFileAsync = promisify(execFile);

test("stores prompts and advances head", async () => {
  const originalCwd = cwd();
  const directory = await mkdtemp(path.join(tmpdir(), "pit-"));
  chdir(directory);

  try {
    await initStore();
    const id = await nextPromptId();
    const record: PromptRecord = {
      id,
      message: "baseline prompt",
      prompt: "Create a tiny app",
      createdAt: "2026-04-21T00:00:00.000Z",
    };

    await savePrompt(record);

    assert.equal(await readHead(), "P-0001");
    assert.deepEqual(await listPrompts(), [record]);
    assert.equal(await nextPromptId(), "P-0002");
  } finally {
    chdir(originalCwd);
  }
});

test("diff compares a prompt with its parent", async () => {
  const originalCwd = cwd();
  const directory = await mkdtemp(path.join(tmpdir(), "pit-"));
  chdir(directory);

  try {
    await initStore();
    await savePrompt({
      id: "P-0001",
      message: "baseline",
      prompt: "Create a CLI",
      createdAt: "2026-04-21T00:00:00.000Z",
    });
    await savePrompt({
      id: "P-0002",
      message: "variant",
      prompt: "Create a CLI\nAdd prompt diff",
      parent: "P-0001",
      createdAt: "2026-04-21T00:01:00.000Z",
    });

    const { stdout } = await execFileAsync("node", [
      "--import",
      path.join(originalCwd, "node_modules/tsx/dist/loader.mjs"),
      path.join(originalCwd, "src/cli.ts"),
      "diff",
      "P-0002",
    ]);

    assert.match(stdout, /diff P-0001 -> P-0002/);
    assert.match(stdout, /- Create a CLI/);
    assert.match(stdout, /\+ Add prompt diff/);
  } finally {
    chdir(originalCwd);
  }
});
