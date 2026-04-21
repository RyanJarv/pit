import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import type { PromptId, PromptRecord } from "./types.js";

const PIT_DIR = ".pit";
const PROMPTS_DIR = path.join(PIT_DIR, "prompts");
const HEAD_FILE = path.join(PIT_DIR, "head");

export async function initStore(): Promise<void> {
  await mkdir(PROMPTS_DIR, { recursive: true });
}

export async function readHead(): Promise<PromptId | undefined> {
  try {
    const value = (await readFile(HEAD_FILE, "utf8")).trim();
    return value ? (value as PromptId) : undefined;
  } catch {
    return undefined;
  }
}

export async function writeHead(id: PromptId): Promise<void> {
  await initStore();
  await writeFile(HEAD_FILE, `${id}\n`, "utf8");
}

export async function nextPromptId(): Promise<PromptId> {
  await initStore();
  const records = await listPrompts();
  const next =
    records
      .map((record) => Number(record.id.replace(/^P-/, "")))
      .filter(Number.isFinite)
      .reduce((max, value) => Math.max(max, value), 0) + 1;
  return `P-${String(next).padStart(4, "0")}`;
}

export async function savePrompt(record: PromptRecord): Promise<void> {
  await initStore();
  await writeFile(promptPath(record.id), YAML.stringify(record), "utf8");
  await writeHead(record.id);
}

export async function readPrompt(id: PromptId): Promise<PromptRecord> {
  const source = await readFile(promptPath(id), "utf8");
  return YAML.parse(source) as PromptRecord;
}

export async function listPrompts(): Promise<PromptRecord[]> {
  await initStore();
  const entries = await readdir(PROMPTS_DIR);
  const records = await Promise.all(
    entries
      .filter((entry) => entry.endsWith(".yaml"))
      .sort()
      .map(async (entry) => {
        const source = await readFile(path.join(PROMPTS_DIR, entry), "utf8");
        return YAML.parse(source) as PromptRecord;
      }),
  );
  return records;
}

function promptPath(id: PromptId): string {
  return path.join(PROMPTS_DIR, `${id}.yaml`);
}

