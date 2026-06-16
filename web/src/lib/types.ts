// Shapes returned by the local WSTV dashboard server (scripts/wstv_server.py).
// Fields are intentionally permissive — the server evolves and the UI degrades
// gracefully when a field is absent.

export type Resolution = "720p" | "1080p";
export type CostPeriod = "today" | "month" | "all";

export interface BudgetSettings {
  total_budget_usd?: number | null;
  daily_budget_usd?: number | null;
  monthly_budget_usd?: number | null;
}

export interface UsageSummary {
  videos_recorded?: number;
  actual_tokens_used?: number;
  estimated_tokens_used?: number;
  total_used_tokens?: number;
  remaining_tokens?: number;
  used_value_usd?: number | null;
  remaining_value_usd?: number | null;
}

export interface TokenPackTracker {
  selected_projected_tokens?: number | string;
  selected_payg_cost_usd?: number | null;
  selected_pack_cost_per_video_usd?: number | null;
  remaining_tokens?: number | string;
  tokens_after_next_video?: number | string;
  remaining_videos_possible?: number | string;
  effective_pack_rate_usd_per_million?: number;
  comparison?: ResolutionComparisonRow[];
}

export interface PackSummaryRow {
  model?: string;
  package_size?: string;
  package_size_tokens?: number;
  quantity?: number;
  total_purchased_tokens?: number;
  total_price_usd?: number | null;
  effective_rate_usd_per_million?: number | null;
  purchase_date?: string;
  expiry_date?: string;
  status?: string;
}

export interface ResolutionComparisonRow {
  resolution?: string;
  tokens?: number | string;
  payg_cost_usd?: number | null;
  pack_cost_per_video_usd?: number | null;
  total_videos_possible?: number | string;
  remaining_videos_possible?: number | string;
  tokens_after_next?: number | string;
  warning?: string;
}

export interface RecentUsageRow {
  timestamp?: string;
  output_filename?: string;
  resolution?: string;
  token_source?: string;
  token_count?: number;
  rate_usd_per_million_tokens?: number;
  source_note?: string;
  error_category?: string;
}

export interface CostSummary {
  budget_settings?: BudgetSettings;
  warnings?: string[];
  blocking_warnings?: string[];
  video_folder?: string;
  ledger_folder?: string;
  token_pack_tracker?: TokenPackTracker;
  usage_summary?: UsageSummary;
  total_spent_usd?: number | null;
  remaining_budget_usd?: number | null;
  paid_videos_generated?: number;
  successful_paid_videos?: number;
  failed_paid_attempts?: number;
  total_tokens_used?: number;
  average_cost_per_successful_video?: number | null;
  selected_resolution?: string;
  next_video_estimate?: { estimated_tokens?: number };
  next_video_estimated_cost_usd?: number | null;
  estimated_more_videos_possible?: number | string;
  pack_summary_table?: PackSummaryRow[];
  resolution_comparison?: ResolutionComparisonRow[];
  recent_paid_history?: RecentUsageRow[];
  recent_usage?: RecentUsageRow[];
}

export interface PipelinePayload {
  scene_idea: string;
  prompt: string;
  image_urls: string[];
  storyboard_ack: boolean;
  output_filename: string;
  resolution: Resolution;
  max_cost_usd: number;
  confirm: string;
}

export interface PipelineResult {
  ok: boolean;
  returncode?: number;
  submitted?: boolean;
  log?: string;
  error?: string;
  mp4_path?: string;
  video_folder?: string;
  cost_summary?: CostSummary;
  timestamp?: string;
}

export interface HistoryEntry {
  timestamp: string;
  ok: boolean;
  submitted: boolean;
  output_filename?: string;
  mp4_path?: string;
  image_url_host?: string;
  image_url_2_host?: string;
  reference_image_count?: number;
  resolution?: string;
}

export interface BudgetPayload {
  total_budget_usd: string;
  daily_budget_usd: string;
  monthly_budget_usd: string;
  period: CostPeriod;
  resolution: Resolution;
}

export interface TokenPackPayload {
  model: string;
  package_size: string;
  quantity: number;
  total_price_usd: number;
  purchase_date: string;
  validity_days: number;
  note: string;
  confirm: string;
  resolution: Resolution;
}

export interface ManualUsagePayload {
  filename: string;
  date: string;
  model: string;
  resolution: Resolution;
  tokens: number;
  token_source: string;
  note: string;
  confirm: string;
}

export interface MutationResult {
  ok: boolean;
  message?: string;
  error?: string;
  recorded?: boolean;
  summary?: CostSummary;
  opened?: string;
}
