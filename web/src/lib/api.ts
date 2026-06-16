import type {
  BudgetPayload,
  CostPeriod,
  CostSummary,
  HistoryEntry,
  ManualUsagePayload,
  MutationResult,
  PipelinePayload,
  PipelineResult,
  Resolution,
  TokenPackPayload,
} from "./types";

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { Accept: "application/json" } });
  return (await res.json()) as T;
}

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json()) as T;
}

export const api = {
  dryRun: (payload: PipelinePayload) =>
    postJSON<PipelineResult>("/api/dry-run", payload),

  generate: (payload: PipelinePayload) =>
    postJSON<PipelineResult>("/api/generate", payload),

  history: () =>
    getJSON<{ ok: boolean; history: HistoryEntry[] }>("/api/history"),

  costSummary: (period: CostPeriod, resolution: Resolution) =>
    getJSON<{ ok: boolean; summary: CostSummary }>(
      `/api/cost-summary?period=${encodeURIComponent(period)}&resolution=${encodeURIComponent(resolution)}`,
    ),

  tokenPackSummary: (resolution: Resolution) =>
    getJSON<{ ok: boolean; summary: CostSummary }>(
      `/api/token-pack-summary?resolution=${encodeURIComponent(resolution)}`,
    ),

  budgetStatus: (resolution: Resolution) =>
    getJSON<{ ok: boolean; blocked: boolean; warnings: string[]; summary: CostSummary }>(
      `/api/budget_status?resolution=${encodeURIComponent(resolution)}`,
    ),

  saveBudget: (payload: BudgetPayload) =>
    postJSON<{ ok: boolean; summary: CostSummary }>("/api/budget-settings", payload),

  resetBudget: () =>
    postJSON<{ ok: boolean; summary: CostSummary }>("/api/budget-settings", { reset: true }),

  addTokenPack: (payload: TokenPackPayload) =>
    postJSON<MutationResult>("/api/token-pack", payload),

  addManualUsage: (payload: ManualUsagePayload) =>
    postJSON<MutationResult>("/api/manual-usage", payload),

  latestVideo: () =>
    getJSON<{ ok: boolean; exists: boolean; name?: string }>("/api/latest-video"),

  videoUrl: (name: string, version: number) =>
    `/api/video?name=${encodeURIComponent(name)}&v=${version}`,

  openVideoFolder: () =>
    postJSON<MutationResult>("/api/open-video-folder", {}),

  openLatestVideo: () =>
    postJSON<MutationResult>("/api/open-latest-video", {}),
};
