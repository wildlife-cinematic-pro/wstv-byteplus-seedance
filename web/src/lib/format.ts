export function money(value: number | null | undefined | string): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return `$${num.toFixed(4)}`;
}

export function moneyShort(value: number | null | undefined | string): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return `$${num.toFixed(2)}`;
}

export function count(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") return value.toLocaleString("en-US");
  return String(value);
}

export function shortDate(value: string | undefined | null): string {
  return String(value || "").slice(0, 10);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
