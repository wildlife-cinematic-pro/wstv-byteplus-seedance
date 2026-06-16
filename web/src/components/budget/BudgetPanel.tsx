import { useEffect, useRef, useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { api } from "@/lib/api";
import { MANUAL_USAGE_CONFIRM, TOKEN_PACK_CONFIRM } from "@/lib/constants";
import { todayIso } from "@/lib/format";
import type { CostPeriod } from "@/lib/types";
import { Button, Card, Field } from "../ui/primitives";
import { RefreshIcon } from "../ui/Icon";
import { Metrics } from "./Metrics";
import { PackTables } from "./PackTables";

export function BudgetPanel() {
  const { summary, setSummary, period, setPeriod, form, refreshCost } = useDashboard();
  const res = form.resolution;

  return (
    <div className="stack" style={{ gap: 18 }}>
      <Card className="stack">
        <div className="card-head">
          <div>
            <h2>Cost & budget</h2>
            <p className="small">
              Calculated from the local ledger and verified token rate. BytePlus Console billing is
              the final source of truth.
            </p>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as CostPeriod)}
              style={{ width: "auto" }}
              aria-label="Cost period filter"
            >
              <option value="today">Today</option>
              <option value="month">This month</option>
              <option value="all">All time</option>
            </select>
            <button className="icon-btn" onClick={refreshCost} title="Refresh" aria-label="Refresh">
              <RefreshIcon size={16} />
            </button>
          </div>
        </div>

        <Metrics summary={summary} resolution={res} />
        {summary?.warnings && summary.warnings.length > 0 && (
          <div className="callout warn">{summary.warnings.join(" ")}</div>
        )}
      </Card>

      <BudgetSettings />
      <TokenPackForm />
      <ManualUsageForm />

      <Card className="stack">
        <PackTables summary={summary} />
      </Card>

      <Card className="stack" style={{ gap: 10 }}>
        <span className="section-title">Local paths</span>
        <div className="field">
          <span className="label">Video folder</span>
          <div className="path">{summary?.video_folder || "—"}</div>
        </div>
        <div className="field">
          <span className="label">Ledger folder</span>
          <div className="path">{summary?.ledger_folder || "data"}</div>
        </div>
      </Card>
    </div>
  );

  function BudgetSettings() {
    const seeded = useRef(false);
    const [total, setTotal] = useState("");
    const [daily, setDaily] = useState("");
    const [monthly, setMonthly] = useState("");
    const [status, setStatus] = useState("");

    useEffect(() => {
      if (seeded.current || !summary?.budget_settings) return;
      seeded.current = true;
      const b = summary.budget_settings;
      setTotal(b.total_budget_usd != null ? String(b.total_budget_usd) : "");
      setDaily(b.daily_budget_usd != null ? String(b.daily_budget_usd) : "");
      setMonthly(b.monthly_budget_usd != null ? String(b.monthly_budget_usd) : "");
    }, []);

    const save = async () => {
      setStatus("Saving…");
      const r = await api.saveBudget({
        total_budget_usd: total,
        daily_budget_usd: daily,
        monthly_budget_usd: monthly,
        period,
        resolution: res,
      });
      setSummary(r.summary);
      setStatus(r.ok ? "Budget saved." : "Could not save budget.");
    };
    const reset = async () => {
      const r = await api.resetBudget();
      setSummary(r.summary);
      seeded.current = false;
      setStatus("Budget setting reset.");
    };

    return (
      <Card className="stack">
        <div className="card-head">
          <h3>Budget limits</h3>
        </div>
        <div className="grid-3">
          <Field label="Total budget (USD)">
            <input type="number" min="0" step="0.01" value={total} onChange={(e) => setTotal(e.target.value)} />
          </Field>
          <Field label="Daily budget (USD)">
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="optional"
              value={daily}
              onChange={(e) => setDaily(e.target.value)}
            />
          </Field>
          <Field label="Monthly budget (USD)">
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="optional"
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
            />
          </Field>
        </div>
        <div className="row wrap">
          <Button variant="primary" onClick={save}>
            Save budget
          </Button>
          <Button variant="ghost" onClick={reset}>
            Reset local setting
          </Button>
          {status && <span className="small faint">{status}</span>}
        </div>
      </Card>
    );
  }

  function TokenPackForm() {
    const [model, setModel] = useState("Dreamina-Seedance-2.0");
    const [pkg, setPkg] = useState("1M");
    const [qty, setQty] = useState("7");
    const [price, setPrice] = useState("30.10");
    const [date, setDate] = useState(todayIso());
    const [validity, setValidity] = useState("90");
    const [note, setNote] = useState("manual BytePlus Console token pack entry");
    const [confirm, setConfirm] = useState("");
    const [status, setStatus] = useState("");

    const add = async () => {
      setStatus("Recording token pack…");
      const r = await api.addTokenPack({
        model,
        package_size: pkg,
        quantity: Number(qty || 0),
        total_price_usd: Number(price || 0),
        purchase_date: date,
        validity_days: Number(validity || 90),
        note,
        confirm,
        resolution: res,
      });
      setStatus(r.ok ? r.message || "Token pack recorded." : r.error || "Failed.");
      if (r.summary) setSummary(r.summary);
      if (r.ok) setConfirm("");
    };

    return (
      <Card className="stack">
        <div className="card-head">
          <div>
            <h3>Add token pack</h3>
            <p className="small">
              Record token resource packs purchased in BytePlus Console. No payment details are
              stored and no API request is made.
            </p>
          </div>
        </div>
        <div className="grid-3">
          <Field label="Model">
            <input value={model} onChange={(e) => setModel(e.target.value)} />
          </Field>
          <Field label="Package size">
            <select value={pkg} onChange={(e) => setPkg(e.target.value)}>
              <option value="1M">1M</option>
              <option value="10M">10M</option>
              <option value="100M">100M</option>
            </select>
          </Field>
          <Field label="Quantity">
            <input type="number" min="1" step="1" value={qty} onChange={(e) => setQty(e.target.value)} />
          </Field>
          <Field label="Total price (USD)">
            <input type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
          </Field>
          <Field label="Purchase date">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Validity (days)">
            <input type="number" min="1" step="1" value={validity} onChange={(e) => setValidity(e.target.value)} />
          </Field>
        </div>
        <Field label="Note">
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <Field label="Confirmation" hint={`Type ${TOKEN_PACK_CONFIRM} to record.`}>
          <input placeholder={TOKEN_PACK_CONFIRM} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <div className="row wrap">
          <Button onClick={add} disabled={confirm !== TOKEN_PACK_CONFIRM}>
            Add token pack
          </Button>
          {status && <span className="small faint">{status}</span>}
        </div>
      </Card>
    );
  }

  function ManualUsageForm() {
    const [filename, setFilename] = useState("");
    const [date, setDate] = useState(todayIso());
    const [model, setModel] = useState("Dreamina-Seedance-2.0");
    const [resolution, setResolution] = useState(res);
    const [tokens, setTokens] = useState("324900");
    const [tokenSource, setTokenSource] = useState("actual_from_console");
    const [note, setNote] = useState("second BytePlus Console usage entry");
    const [confirm, setConfirm] = useState("");
    const [status, setStatus] = useState("");

    const add = async () => {
      setStatus("Recording manual usage…");
      const r = await api.addManualUsage({
        filename,
        date,
        model,
        resolution,
        tokens: Number(tokens || 0),
        token_source: tokenSource,
        note,
        confirm,
      });
      setStatus(r.ok ? r.message || "Manual usage recorded." : r.error || "Failed.");
      if (r.summary) setSummary(r.summary);
      if (r.ok) {
        setConfirm("");
        refreshCost();
      }
    };

    return (
      <Card className="stack">
        <div className="card-head">
          <div>
            <h3>Add console usage manually</h3>
            <p className="small">
              For paid videos that appear in BytePlus Console but are missing from the local ledger.
              No BytePlus API request is made.
            </p>
          </div>
        </div>
        <div className="grid-3">
          <Field label="Filename">
            <input placeholder="second-video.mp4" value={filename} onChange={(e) => setFilename(e.target.value)} />
          </Field>
          <Field label="Date">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Model">
            <input value={model} onChange={(e) => setModel(e.target.value)} />
          </Field>
          <Field label="Resolution">
            <select value={resolution} onChange={(e) => setResolution(e.target.value as typeof resolution)}>
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
            </select>
          </Field>
          <Field label="Tokens">
            <input type="number" min="1" step="1" value={tokens} onChange={(e) => setTokens(e.target.value)} />
          </Field>
          <Field label="Token source">
            <select value={tokenSource} onChange={(e) => setTokenSource(e.target.value)}>
              <option value="actual_from_console">actual_from_console</option>
              <option value="estimated">estimated</option>
            </select>
          </Field>
        </div>
        <Field label="Note">
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <Field label="Confirmation" hint={`Type ${MANUAL_USAGE_CONFIRM} to record.`}>
          <input placeholder={MANUAL_USAGE_CONFIRM} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <div className="row wrap">
          <Button onClick={add} disabled={confirm !== MANUAL_USAGE_CONFIRM}>
            Add console usage
          </Button>
          {status && <span className="small faint">{status}</span>}
        </div>
      </Card>
    );
  }
}
