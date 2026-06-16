import type { ReactNode } from "react";
import { CheckIcon } from "../ui/Icon";

export function Step({
  index,
  title,
  subtitle,
  active,
  done,
  disabled,
  onToggle,
  children,
}: {
  index: number;
  title: string;
  subtitle?: ReactNode;
  active: boolean;
  done: boolean;
  disabled?: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const cls = ["step", active ? "active" : "", done && !active ? "done" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <section className={cls}>
      <button
        type="button"
        className="step-head"
        onClick={onToggle}
        disabled={disabled}
        aria-expanded={active}
      >
        <span className="step-num">{done && !active ? <CheckIcon size={14} /> : index}</span>
        <span className="step-title">
          <b>{title}</b>
          {subtitle && <span>{subtitle}</span>}
        </span>
      </button>
      <div className="step-body-wrap" data-open={active} aria-hidden={!active}>
        <div className="step-body-outer">
          <div className="step-body">{children}</div>
        </div>
      </div>
    </section>
  );
}
