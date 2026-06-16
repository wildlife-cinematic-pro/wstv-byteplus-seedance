import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import { CONFIRM_TOKEN, MAX_REFERENCE_IMAGES, PROMPT_LIMIT, isWstvHost } from "@/lib/constants";
import type {
  CostPeriod,
  CostSummary,
  HistoryEntry,
  PipelinePayload,
  PipelineResult,
  Resolution,
} from "@/lib/types";

export type StatusBadge =
  | "READY"
  | "DRY RUN OK"
  | "PAID RECORDED"
  | "GENERATING"
  | "ERROR";

interface FormState {
  sceneIdea: string;
  prompt: string;
  preset: string;
  imageUrls: string[];
  storyboardAck: boolean;
  imageHostOverride: boolean;
  outputFilename: string;
  resolution: Resolution;
  maxCost: string;
  confirm: string;
}

const INITIAL_FORM: FormState = {
  sceneIdea: "",
  prompt: "",
  preset: "",
  imageUrls: [],
  storyboardAck: false,
  imageHostOverride: false,
  outputFilename: "wstv-output.mp4",
  resolution: "720p",
  maxCost: "3",
  confirm: "",
};

// Fields whose change invalidates a prior successful dry run.
const RESET_KEYS: (keyof FormState)[] = [
  "sceneIdea",
  "prompt",
  "preset",
  "imageUrls",
  "outputFilename",
  "resolution",
  "maxCost",
];

const TOKEN_PACK_WARNING = "Not enough active tokens for next selected resolution.";

interface Validation {
  finalPrompt: string;
  promptLength: number;
  promptTooLong: boolean;
  referenceImageCount: number;
  imageHostWarningActive: boolean;
  invalidReferenceUrl: boolean;
  needsStoryboardAck: boolean;
  needsImageOverride: boolean;
  canDryRun: boolean;
  canGenerate: boolean;
}

interface DashboardValue {
  form: FormState;
  setField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  applyPreset: (value: string, text: string) => void;
  addImage: () => void;
  removeImage: (index: number) => void;
  setImageAt: (index: number, value: string) => void;

  safeMode: boolean;
  setSafeMode: (v: boolean) => void;

  validation: Validation;
  statusBadge: StatusBadge;
  budgetBlocked: boolean;
  tokenPackBlocked: boolean;

  dryRunOk: boolean;
  dryRunning: boolean;
  generating: boolean;
  result: PipelineResult | null;
  lastVideoPath: string;

  summary: CostSummary | null;
  setSummary: (s: CostSummary | undefined | null) => void;
  history: HistoryEntry[];

  period: CostPeriod;
  setPeriod: (p: CostPeriod) => void;

  runDryRun: () => Promise<void>;
  runGenerate: () => Promise<void>;
  refreshCost: () => Promise<void>;
  refreshHistory: () => Promise<void>;
}

const DashboardContext = createContext<DashboardValue | null>(null);

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [safeMode, setSafeMode] = useState(true);
  const [dryRunOk, setDryRunOk] = useState(false);
  const [dryRunning, setDryRunning] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [lastVideoPath, setLastVideoPath] = useState("");
  const [statusBadge, setStatusBadge] = useState<StatusBadge>("READY");
  const [summary, setSummaryState] = useState<CostSummary | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [period, setPeriod] = useState<CostPeriod>("all");

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (RESET_KEYS.includes(key)) setDryRunOk(false);
  }, []);

  const applyPreset = useCallback((value: string, text: string) => {
    setForm((prev) => ({ ...prev, preset: value, prompt: text || prev.prompt }));
    setDryRunOk(false);
  }, []);

  const addImage = useCallback(() => {
    setForm((prev) =>
      prev.imageUrls.length >= MAX_REFERENCE_IMAGES
        ? prev
        : { ...prev, imageUrls: [...prev.imageUrls, ""] },
    );
    setDryRunOk(false);
  }, []);

  const removeImage = useCallback((index: number) => {
    setForm((prev) => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== index) }));
    setDryRunOk(false);
  }, []);

  const setImageAt = useCallback((index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.map((url, i) => (i === index ? value : url)),
    }));
    setDryRunOk(false);
  }, []);

  const setSummary = useCallback((s: CostSummary | undefined | null) => {
    if (s) setSummaryState(s);
  }, []);

  // Derived blocking flags, matching the server's gating semantics.
  const blocking = summary?.blocking_warnings ?? [];
  const budgetBlocked = blocking.some((w) => w !== TOKEN_PACK_WARNING);
  const tokenPackBlocked = blocking.some((w) => w === TOKEN_PACK_WARNING);

  const validation = useMemo<Validation>(() => {
    const finalPrompt = form.prompt || form.sceneIdea || "";
    const promptLength = finalPrompt.length;
    const promptTooLong = promptLength > PROMPT_LIMIT;

    const refs = form.imageUrls.map((u) => u.trim()).filter(Boolean);
    const referenceImageCount = refs.length;
    const commaSeparated = form.imageUrls.some((u) => u.includes(","));

    let imageHostWarningActive = false;
    let invalidReferenceUrl = commaSeparated;
    for (const value of refs) {
      const url = parseUrl(value);
      if (!url || url.protocol !== "https:") {
        invalidReferenceUrl = true;
        continue;
      }
      if (!isWstvHost(url.hostname)) imageHostWarningActive = true;
    }

    // Any reference beyond the master (image 1) carries storyboard-copy risk.
    const needsStoryboardAck = referenceImageCount > 1 && !form.storyboardAck;
    const needsImageOverride = imageHostWarningActive && !form.imageHostOverride;

    const canDryRun =
      (!!form.prompt.trim() || !!form.sceneIdea.trim()) &&
      !promptTooLong &&
      !invalidReferenceUrl;

    const canGenerate = !(
      safeMode ||
      !dryRunOk ||
      form.confirm !== CONFIRM_TOKEN ||
      promptTooLong ||
      invalidReferenceUrl ||
      needsStoryboardAck ||
      needsImageOverride ||
      budgetBlocked ||
      tokenPackBlocked
    );

    return {
      finalPrompt,
      promptLength,
      promptTooLong,
      referenceImageCount,
      imageHostWarningActive,
      invalidReferenceUrl,
      needsStoryboardAck,
      needsImageOverride,
      canDryRun,
      canGenerate,
    };
  }, [form, safeMode, dryRunOk, budgetBlocked, tokenPackBlocked]);

  const payload = useCallback(
    (): PipelinePayload => ({
      scene_idea: form.sceneIdea,
      prompt: form.prompt,
      image_urls: form.imageUrls.map((u) => u.trim()).filter(Boolean),
      storyboard_ack: form.storyboardAck,
      output_filename: form.outputFilename,
      resolution: form.resolution,
      max_cost_usd: Number(form.maxCost || 3),
      confirm: form.confirm,
    }),
    [form],
  );

  const refreshHistory = useCallback(async () => {
    try {
      const res = await api.history();
      setHistory(res.history || []);
    } catch {
      /* offline-tolerant */
    }
  }, []);

  const refreshCost = useCallback(async () => {
    try {
      const res = await api.costSummary(period, form.resolution);
      setSummary(res.summary);
    } catch {
      /* offline-tolerant */
    }
  }, [period, form.resolution, setSummary]);

  const runDryRun = useCallback(async () => {
    setDryRunning(true);
    setDryRunOk(false);
    setStatusBadge("READY");
    try {
      const res = await api.dryRun(payload());
      setResult(res);
      setDryRunOk(!!res.ok);
      setStatusBadge(res.ok ? "DRY RUN OK" : "ERROR");
      setSummary(res.cost_summary);
      if (res.mp4_path) setLastVideoPath(res.mp4_path);
    } catch (err) {
      setResult({ ok: false, error: String(err) });
      setStatusBadge("ERROR");
    } finally {
      setDryRunning(false);
      refreshHistory();
      refreshCost();
    }
  }, [payload, setSummary, refreshHistory, refreshCost]);

  const runGenerate = useCallback(async () => {
    setGenerating(true);
    setStatusBadge("GENERATING");
    try {
      const res = await api.generate(payload());
      setResult(res);
      setStatusBadge(res.ok ? "PAID RECORDED" : "ERROR");
      setSummary(res.cost_summary);
      if (res.mp4_path) setLastVideoPath(res.mp4_path);
      if (res.ok) {
        setForm((prev) => ({ ...prev, confirm: "" }));
      }
    } catch (err) {
      setResult({ ok: false, error: String(err) });
      setStatusBadge("ERROR");
    } finally {
      setDryRunOk(false);
      setGenerating(false);
      refreshHistory();
      refreshCost();
    }
  }, [payload, setSummary, refreshHistory, refreshCost]);

  // Initial load.
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    refreshHistory();
    refreshCost();
  }, [refreshHistory, refreshCost]);

  // Resolution / period drive the cost summary.
  useEffect(() => {
    refreshCost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.resolution, period]);

  const value: DashboardValue = {
    form,
    setField,
    applyPreset,
    addImage,
    removeImage,
    setImageAt,
    safeMode,
    setSafeMode,
    validation,
    statusBadge,
    budgetBlocked,
    tokenPackBlocked,
    dryRunOk,
    dryRunning,
    generating,
    result,
    lastVideoPath,
    summary,
    setSummary,
    history,
    period,
    setPeriod,
    runDryRun,
    runGenerate,
    refreshCost,
    refreshHistory,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard(): DashboardValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
