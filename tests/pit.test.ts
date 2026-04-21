import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { chdir, cwd } from "node:process";
import { test } from "node:test";
import {
  initStore,
  listPrompts,
  nextPromptId,
  readHead,
  savePrompt,
} from "../src/store.js";
import type { PromptRecord } from "../src/types.js";

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

