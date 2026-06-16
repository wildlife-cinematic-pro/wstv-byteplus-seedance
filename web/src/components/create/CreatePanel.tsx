import { useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { MAX_REFERENCE_IMAGES, PROMPT_LIMIT, PROMPT_PRESETS, RESOLUTIONS } from "@/lib/constants";
import { Button, Callout, Field } from "../ui/primitives";
import { CopyIcon, SparkIcon } from "../ui/Icon";
import { ImageField } from "../ImageField";
import { Step } from "./Step";
import { GenerateStep } from "./GenerateStep";

export function CreatePanel() {
  const { form, setField, applyPreset, addImage, removeImage, setImageAt, validation } =
    useDashboard();
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);

  const toggle = (i: number) => setActive((cur) => (cur === i ? -1 : i));
  const next = (i: number) => setActive(i + 1);

  const v = validation;
  const promptDone = (!!form.prompt.trim() || !!form.sceneIdea.trim()) && !v.promptTooLong;
  const refsDone = !v.invalidReferenceUrl && !v.needsStoryboardAck && !v.needsImageOverride;
  const outputDone = !!form.outputFilename.trim() && Number(form.maxCost) > 0;

  const counterClass =
    v.promptLength < 3000 ? "counter" : v.promptLength <= 3400 ? "counter amber" : "counter red";

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(v.finalPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="steps">
      {/* 1 — Prompt --------------------------------------------------------- */}
      <Step
        index={1}
        title="Scene & prompt"
        subtitle={
          active === 0
            ? "Describe the scene or paste a final Seedance prompt"
            : promptDone
              ? truncate(v.finalPrompt)
              : "Required"
        }
        active={active === 0}
        done={promptDone}
        onToggle={() => toggle(0)}
      >
        <Field label="Scene idea" htmlFor="sceneIdea" hint="Used as the prompt if the final prompt is left empty.">
          <textarea
            id="sceneIdea"
            placeholder="A young sea lion looks toward a cinematic sunset surf…"
            value={form.sceneIdea}
            onChange={(e) => setField("sceneIdea", e.target.value)}
          />
        </Field>

        <Field label="Prompt preset" htmlFor="preset">
          <select
            id="preset"
            value={form.preset}
            onChange={(e) => {
              const preset = PROMPT_PRESETS.find((p) => p.value === e.target.value);
              applyPreset(e.target.value, preset?.text ?? "");
            }}
          >
            <option value="">Start from a preset…</option>
            {PROMPT_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Final Seedance prompt" htmlFor="prompt">
          <textarea
            id="prompt"
            placeholder="Final production prompt. If empty, the scene idea is used."
            value={form.prompt}
            onChange={(e) => setField("prompt", e.target.value)}
            style={{ minHeight: 132 }}
          />
        </Field>

        <div className="row between">
          <span className={counterClass}>
            {v.promptLength.toLocaleString()} / {PROMPT_LIMIT.toLocaleString()} characters
          </span>
          <Button size="sm" variant="ghost" onClick={copyPrompt} disabled={!v.finalPrompt}>
            <CopyIcon size={14} /> {copied ? "Copied" : "Copy prompt"}
          </Button>
        </div>

        {v.promptTooLong && (
          <Callout tone="danger">
            Prompt exceeds the {PROMPT_LIMIT.toLocaleString()}-character limit. Shorten it before paid
            generation.
          </Callout>
        )}

        <div className="step-actions">
          <Button variant="primary" onClick={() => next(0)} disabled={!promptDone}>
            Continue
          </Button>
        </div>
      </Step>

      {/* 2 — References ----------------------------------------------------- */}
      <Step
        index={2}
        title="Reference images"
        subtitle={
          active === 1
            ? "Optional identity & storyboard anchors"
            : `${v.referenceImageCount} image${v.referenceImageCount === 1 ? "" : "s"}`
        }
        active={active === 1}
        done={refsDone && active > 1}
        disabled={!promptDone}
        onToggle={() => promptDone && toggle(1)}
      >
        <p className="small faint" style={{ margin: 0 }}>
          Optional. Add up to {MAX_REFERENCE_IMAGES} reference images. Image 1 is the master identity
          / environment anchor; the rest guide additional references, storyboard, and motion.
        </p>

        {form.imageUrls.length === 0 ? (
          <div className="images-empty small">No reference images added yet.</div>
        ) : (
          <div className="image-table">
            {form.imageUrls.map((url, i) => (
              <ImageField
                key={i}
                index={i}
                value={url}
                onChange={(val) => setImageAt(i, val)}
                onRemove={() => removeImage(i)}
              />
            ))}
          </div>
        )}

        {v.referenceImageCount > 1 && (
          <>
            <Callout tone="warn">
              Additional images may include storyboard grids, borders, frame numbers, captions, logos,
              or watermarks that the model can copy. Use them only as shot-order, framing, and motion
              guides.
            </Callout>
            <label className="check">
              <input
                type="checkbox"
                checked={form.storyboardAck}
                onChange={(e) => setField("storyboardAck", e.target.checked)}
              />
              I understand storyboard text/grid may be copied.
            </label>
          </>
        )}

        {v.imageHostWarningActive && (
          <label className="check">
            <input
              type="checkbox"
              checked={form.imageHostOverride}
              onChange={(e) => setField("imageHostOverride", e.target.checked)}
            />
            I reviewed this non-WSTV image host and approve it for paid generation.
          </label>
        )}

        <div className="step-actions">
          <Button variant="primary" onClick={() => next(1)} disabled={!refsDone}>
            Continue
          </Button>
          <Button variant="ghost" onClick={() => next(1)}>
            Skip
          </Button>
          <Button
            className="add-image"
            onClick={addImage}
            disabled={form.imageUrls.length >= MAX_REFERENCE_IMAGES}
            style={{ marginLeft: "auto" }}
          >
            + Add image{" "}
            <span className="faint" style={{ fontWeight: 500 }}>
              {form.imageUrls.length}/{MAX_REFERENCE_IMAGES}
            </span>
          </Button>
        </div>
      </Step>

      {/* 3 — Output --------------------------------------------------------- */}
      <Step
        index={3}
        title="Output settings"
        subtitle={
          active === 2 ? "Filename, resolution, and cost cap" : `${form.resolution} · ${form.outputFilename}`
        }
        active={active === 2}
        done={outputDone && active > 2}
        disabled={!promptDone}
        onToggle={() => promptDone && toggle(2)}
      >
        <div className="grid-2">
          <Field label="Output filename" htmlFor="outputFilename">
            <input
              id="outputFilename"
              value={form.outputFilename}
              onChange={(e) => setField("outputFilename", e.target.value)}
            />
          </Field>
          <Field label="Max cost (USD)" htmlFor="maxCost">
            <input
              id="maxCost"
              type="number"
              min="0"
              step="0.01"
              value={form.maxCost}
              onChange={(e) => setField("maxCost", e.target.value)}
            />
          </Field>
        </div>

        <Field label="Resolution" htmlFor="resolution">
          <select
            id="resolution"
            value={form.resolution}
            onChange={(e) => setField("resolution", e.target.value as typeof form.resolution)}
          >
            {RESOLUTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
        {form.resolution === "1080p" && (
          <Callout tone="warn">
            1080p uses more than 2× the tokens of 720p. Use 720p for testing and 1080p only for
            final, high-value scenes.
          </Callout>
        )}

        <div className="step-actions">
          <Button variant="primary" onClick={() => next(2)} disabled={!outputDone}>
            Continue
          </Button>
        </div>
      </Step>

      {/* 4 — Validate & generate ------------------------------------------- */}
      <Step
        index={4}
        title="Validate & generate"
        subtitle={
          active === 3 ? (
            <span className="row" style={{ gap: 5 }}>
              <SparkIcon size={12} /> Dry-run, then submit one paid task
            </span>
          ) : (
            "Dry-run first, then paid submit"
          )
        }
        active={active === 3}
        done={false}
        disabled={!promptDone || !outputDone}
        onToggle={() => promptDone && outputDone && toggle(3)}
      >
        <GenerateStep />
      </Step>
    </div>
  );
}

function truncate(text: string, n = 64): string {
  const t = text.trim();
  return t.length > n ? `${t.slice(0, n)}…` : t || "Required";
}
