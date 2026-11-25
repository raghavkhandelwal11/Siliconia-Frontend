"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/Icon";

type Theme = "system" | "light" | "dark";
const KEY = "sx-theme";
const ORDER: Theme[] = ["system", "light", "dark"];

/** Inline script for <head>: applies a saved theme before the first paint. */
export const themeScript = `try{var t=localStorage.getItem("${KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

const EVENT = "sx-theme-change";

function current(): Theme {
  const t = document.documentElement.dataset.theme;
  return t === "light" || t === "dark" ? t : "system";
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
  try {
    if (theme === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, theme);
  } catch {
    // Private mode or blocked storage: the choice lasts for this page only.
  }
  window.dispatchEvent(new Event(EVENT)); // keeps every toggle on the page in step
}

// Cycles System → Light → Dark. The saved choice lives on this device only.
export function ThemeToggle({ className = "" }: { className?: string }) {
  const t = useTranslations("shell.theme");
  // The <html data-theme> attribute is the source of truth (set before paint).
  const theme = useSyncExternalStore(subscribe, current, () => "system" as Theme);

  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
  const icon = theme === "light" ? "sun" : theme === "dark" ? "moon" : "monitor";
  return (
    <button
      type="button"
      onClick={() => apply(next)}
      aria-label={t("label", { current: t(theme), next: t(next) })}
      title={t("label", { current: t(theme), next: t(next) })}
      className={`size-10 items-center justify-center rounded-full text-muted transition hover:bg-bg hover:text-ink ${className || "inline-flex"}`}
    >
      <Icon name={icon} />
    </button>
  );
}
