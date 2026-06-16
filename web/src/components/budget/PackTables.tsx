import { count, money, shortDate } from "@/lib/format";
import type { CostSummary } from "@/lib/types";

export function PackTables({ summary }: { summary: CostSummary | null }) {
  const s = summary ?? {};
  const pack = s.token_pack_tracker ?? {};
  const usage = s.usage_summary ?? {};
  const packRows = s.pack_summary_table ?? [];
  const comparison = s.resolution_comparison ?? pack.comparison ?? [];
  const recent = s.recent_paid_history ?? s.recent_usage ?? [];

  const packRate = pack.effective_pack_rate_usd_per_million ?? 4.3;

  return (
    <>
      <span className="section-title">Pack summary</span>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Model</th>
              <th>Size</th>
              <th>Qty</th>
              <th>Purchased tokens</th>
              <th>Price</th>
              <th>Rate / 1M</th>
              <th>Purchased</th>
              <th>Expires</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {packRows.length === 0 && (
              <tr className="empty-row">
                <td colSpan={9}>No active token pack recorded.</td>
              </tr>
            )}
            {packRows.map((r, i) => {
              const size =
                r.package_size || (r.package_size_tokens ? `${Number(r.package_size_tokens) / 1e6}M` : "—");
              return (
                <tr key={i}>
                  <td>{r.model || "—"}</td>
                  <td>{size}</td>
                  <td>{count(r.quantity)}</td>
                  <td>{count(r.total_purchased_tokens)}</td>
                  <td>{money(r.total_price_usd)}</td>
                  <td>{money(r.effective_rate_usd_per_million)}</td>
                  <td>{r.purchase_date || "—"}</td>
                  <td>{r.expiry_date || "—"}</td>
                  <td>{r.status || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <span className="section-title">Usage summary</span>
      <div className="table-wrap">
        <table className="kv">
          <tbody>
            {(
              [
                ["Videos recorded", count(usage.videos_recorded ?? 0)],
                ["Actual tokens used", count(usage.actual_tokens_used ?? 0)],
                ["Estimated tokens used", count(usage.estimated_tokens_used ?? 0)],
                ["Total used tokens", count(usage.total_used_tokens ?? 0)],
                ["Remaining tokens", count(usage.remaining_tokens ?? 0)],
                ["Used value", money(usage.used_value_usd)],
                ["Remaining value", money(usage.remaining_value_usd)],
              ] as [string, string][]
            ).map(([k, v]) => (
              <tr key={k}>
                <th>{k}</th>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <span className="section-title">Resolution comparison</span>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Resolution</th>
              <th>Tokens / video</th>
              <th>PAYG / video</th>
              <th>Pack / video</th>
              <th>Videos from pack</th>
              <th>Remaining now</th>
              <th>Tokens after next</th>
              <th>Warning</th>
            </tr>
          </thead>
          <tbody>
            {comparison.length === 0 && (
              <tr className="empty-row">
                <td colSpan={8}>No comparison data yet.</td>
              </tr>
            )}
            {comparison.map((r, i) => (
              <tr key={i}>
                <td>{r.resolution || "—"}</td>
                <td>{count(r.tokens)}</td>
                <td>{money(r.payg_cost_usd)}</td>
                <td>{money(r.pack_cost_per_video_usd)}</td>
                <td>{count(r.total_videos_possible)}</td>
                <td>{count(r.remaining_videos_possible)}</td>
                <td>{count(r.tokens_after_next)}</td>
                <td style={{ color: r.warning ? "var(--warn)" : undefined }}>{r.warning || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <span className="section-title">Recent usage</span>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Filename</th>
              <th>Resolution</th>
              <th>Token source</th>
              <th>Tokens</th>
              <th>PAYG cost</th>
              <th>Pack cost</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 && (
              <tr className="empty-row">
                <td colSpan={8}>No usage recorded yet.</td>
              </tr>
            )}
            {recent.map((r, i) => {
              const tokens = Number(r.token_count || 0);
              const payg = r.rate_usd_per_million_tokens ?? 7.0;
              return (
                <tr key={i}>
                  <td>{shortDate(r.timestamp)}</td>
                  <td>{r.output_filename || "—"}</td>
                  <td>{r.resolution || "—"}</td>
                  <td>{r.token_source || "unknown"}</td>
                  <td>{count(tokens)}</td>
                  <td>{money((tokens * payg) / 1e6)}</td>
                  <td>{money((tokens * packRate) / 1e6)}</td>
                  <td>{r.source_note || r.error_category || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
