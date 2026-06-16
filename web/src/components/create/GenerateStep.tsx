import { useDashboard } from "@/context/DashboardContext";
import { CONFIRM_TOKEN } from "@/lib/constants";
import { Button, Callout, Field } from "../ui/primitives";
import { PlayIcon, ShieldIcon, SpinnerIcon } from "../ui/Icon";

export function GenerateStep() {
  const {
    form,
    setField,
    validation,
    safeMode,
    dryRunOk,
    dryRunning,
    generating,
    runDryRun,
    runGenerate,
    budgetBlocked,
    tokenPackBlocked,
    result,
  } = useDashboard();

  const v = validation;
  const blockers: string[] = [];
  if (v.promptTooLong) blockers.push("Prompt is over the character limit.");
  if (v.invalidReferenceUrl) blockers.push("A reference URL is invalid.");
  if (v.needsStoryboardAck) blockers.push("Storyboard acknowledgement is required.");
  if (v.needsImageOverride) blockers.push("Non-WSTV image host needs approval.");
  if (budgetBlocked) blockers.push("Budget check is blocking paid submit.");
  if (tokenPackBlocked) blockers.push("Not enough active tokens for this resolution.");

  return (
    <>
      {/* Validate phase — only while Safe Mode is on. */}
      {safeMode && (
        <>
          <div className="callout">
            <span className="ico">
              <ShieldIcon size={15} />
            </span>
            <span>
              Dry run validates inputs and public image URLs and makes <b>no</b> paid BytePlus
              request. <b>Safe Mode is ON</b>, so paid generation is disabled — turn it off to reveal
              the paid zone.
            </span>
          </div>

          <div className="step-actions">
            <Button variant="primary" onClick={runDryRun} disabled={dryRunning || !v.canDryRun}>
              {dryRunning ? <SpinnerIcon size={14} /> : null}
              {dryRunning ? "Validating…" : "Run dry run"}
            </Button>
            {dryRunOk && (
              <span className="row" style={{ color: "var(--ok)", fontWeight: 550, fontSize: 13 }}>
                Dry run passed
              </span>
            )}
          </div>
        </>
      )}

      {result && !result.ok && (result.error || result.log) && (
        <Callout tone="danger">{result.error || "Dry run failed. See the log."}</Callout>
      )}

      {blockers.length > 0 && (
        <div className="callout warn">
          <div>
            <b>Before paid submit:</b>
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Paid zone (only when Safe Mode is off) ---------------------------- */}
      {!safeMode && (
        <div className="paid-zone fade-in">
          <div className="row between">
            <b style={{ color: "var(--danger)" }}>Paid zone</b>
            <span className="small" style={{ color: "var(--danger)" }}>
              Spends BytePlus credits
            </span>
          </div>
          <p className="small">
            Generation stays disabled until a dry run succeeds and you type the exact confirmation.
          </p>
          <Field label="Type to confirm" htmlFor="confirm">
            <input
              id="confirm"
              placeholder={CONFIRM_TOKEN}
              value={form.confirm}
              onChange={(e) => setField("confirm", e.target.value)}
              spellCheck={false}
              autoComplete="off"
            />
          </Field>
          <Button
            variant="danger"
            onClick={runGenerate}
            disabled={!v.canGenerate || generating}
          >
            {generating ? <SpinnerIcon size={14} /> : <PlayIcon size={14} />}
            {generating ? "Submitting…" : "Submit one paid task"}
          </Button>
        </div>
      )}
    </>
  );
}
