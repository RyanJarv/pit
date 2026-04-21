export type PromptId = `P-${string}`;

export interface PromptRecord {
  id: PromptId;
  message: string;
  prompt: string;
  parent?: PromptId;
  createdAt: string;
  git?: {
    baseCommit?: string;
    resultCommit?: string;
  };
  result?: {
    note?: string;
    recordedAt: string;
  };
}

