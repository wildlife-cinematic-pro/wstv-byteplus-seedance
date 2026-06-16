import { count, money, moneyShort } from "@/lib/format";
import type { CostSummary, Resolution } from "@/lib/types";

function Cell({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="metric">
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  );
}

export function Metrics({
  summary,
  resolution,
}: {
  summary: CostSummary | null;
  resolution: Resolution;
}) {
  const s = summary ?? {};
  const pack = s.token_pack_tracker ?? {};
  const nextTokens =
    pack.selected_projected_tokens ?? s.next_video_estimate?.estimated_tokens ?? "—";
  const nextCost = pack.selected_payg_cost_usd ?? s.next_video_estimated_cost_usd;

  return (
    <div className="metrics">
      <Cell k="Total budget" v={moneyShort(s.budget_settings?.total_budget_usd)} />
      <Cell k="Total spent" v={moneyShort(s.total_spent_usd)} />
      <Cell k="Remaining budget" v={moneyShort(s.remaining_budget_usd)} />
      <Cell k="Paid videos" v={count(s.paid_videos_generated ?? 0)} />

      <Cell k={`Next tokens · ${resolution}`} v={count(nextTokens)} />
      <Cell k="PAYG next cost" v={money(nextCost)} />
      <Cell k="Pack tokens left" v={count(pack.remaining_tokens ?? "—")} />
      <Cell k="Est. videos left" v={count(s.estimated_more_videos_possible ?? "—")} />
    </div>
  );
}
