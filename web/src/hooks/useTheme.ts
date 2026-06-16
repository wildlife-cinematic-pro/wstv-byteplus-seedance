import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "wstv-theme";

function initialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    const root = document.documentElement;
    // Suppress transitions/animations across the variable swap so nothing
    // re-animates (checkboxes, switches) while the theme changes.
    root.classList.add("no-transitions");
    root.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => root.classList.remove("no-transitions")),
    );
    return () => cancelAnimationFrame(raf);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return { theme, toggle };
}
