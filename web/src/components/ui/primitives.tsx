import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { AlertIcon, CheckIcon, InfoIcon } from "./Icon";

/* ---- Button ---------------------------------------------------------------- */

type Variant = "default" | "primary" | "danger" | "ghost";
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md";
}
export function Button({ variant = "default", size = "md", className = "", ...rest }: BtnProps) {
  const cls = ["btn", variant !== "default" ? variant : "", size === "sm" ? "sm" : "", className]
    .filter(Boolean)
    .join(" ");
  return <button className={cls} {...rest} />;
}

/* ---- Card ------------------------------------------------------------------ */

export function Card({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`card ${className}`} style={style}>
      {children}
    </div>
  );
}

/* ---- Field ----------------------------------------------------------------- */

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

/* ---- Switch ---------------------------------------------------------------- */

export function Switch({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  label?: ReactNode;
}) {
  return (
    <button
      type="button"
      className="switch"
      data-on={on}
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
    >
      <span className="track">
        <span className="thumb" />
      </span>
      {label && <span className="switch-label">{label}</span>}
    </button>
  );
}

/* ---- Badge ----------------------------------------------------------------- */

type BadgeTone = "neutral" | "ok" | "warn" | "danger" | "solid";
export function Badge({
  children,
  tone = "neutral",
  dot,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
}) {
  const cls = tone === "neutral" ? "badge" : `badge ${tone}`;
  return (
    <span className={cls}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

/* ---- Callout --------------------------------------------------------------- */

type CalloutTone = "info" | "ok" | "warn" | "danger";
export function Callout({
  tone = "info",
  children,
}: {
  tone?: CalloutTone;
  children: ReactNode;
}) {
  const cls = tone === "info" ? "callout" : `callout ${tone}`;
  const Icon = tone === "ok" ? CheckIcon : tone === "info" ? InfoIcon : AlertIcon;
  return (
    <div className={cls}>
      <span className="ico">
        <Icon size={15} />
      </span>
      <div>{children}</div>
    </div>
  );
}
