import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

/**
 * Applies the browser preferred color scheme to the document root and keeps it
 * in sync when the preference changes.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = (isDark: boolean) => {
      const root = window.document.documentElement;
      if (isDark) {
        root.classList.add("dark");
        setTheme("dark");
      } else {
        root.classList.remove("dark");
        setTheme("light");
      }
    };

    apply(query.matches);
    const handler = (e: MediaQueryListEvent) => apply(e.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);

  return { theme } as const;
}
