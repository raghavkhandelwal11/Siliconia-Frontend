"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { api } from "@/lib/api/client";
import type { Suggestion } from "@/lib/search";
import { Icon } from "@/components/ui/Icon";

const RECENT_KEY = "sx-recent-searches";

function readRecent(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 5) : [];
  } catch {
    return [];
  }
}

function saveRecent(q: string) {
  try {
    const next = [q, ...readRecent().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: recent searches are a convenience only.
  }
}

type Option = {
  id: string;
  kind: Suggestion["kind"] | "recent";
  text: string;
  href: string;
  cover?: string;
  brand?: string;
};

// UI-GLB-01 search box: suggestions for products, brands and categories as you
// type, and recent searches kept on this device (ARIA combobox pattern).
export function SearchBox() {
  const t = useTranslations("listing.searchBox");
  const router = useRouter();
  const id = useId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [active, setActive] = useState(-1);
  const seq = useRef(0);

  useEffect(() => {
    const text = q.trim();
    if (text.length < 2) {
      const recent = readRecent().map((r, i) => ({
        id: `r${i}`,
        kind: "recent" as const,
        text: r,
        href: `/search?q=${encodeURIComponent(r)}`,
      }));
      const timer = setTimeout(() => setOptions(recent), 0);
      return () => clearTimeout(timer);
    }
    const mine = ++seq.current;
    const timer = setTimeout(async () => {
      const res = await api.GET("/products/suggest", { params: { query: { q: text } } }).catch(() => null);
      if (mine !== seq.current || !res?.data) return;
      setOptions(
        res.data.suggestions.map((s, i) => ({
          id: `s${i}`,
          kind: s.kind,
          text: s.text,
          cover: s.coverUrl,
          brand: s.brand,
          href:
            s.kind === "product"
              ? `/p/${s.slug}`
              : s.kind === "category"
                ? `/c/${s.slug}`
                : `/search?brand=${encodeURIComponent(s.text)}`,
        })),
      );
      setActive(-1);
    }, 180);
    return () => clearTimeout(timer);
  }, [q]);

  function go(href: string, text?: string) {
    if (text) saveRecent(text);
    setOpen(false);
    router.push(href);
  }

  const listId = `${id}-list`;
  const showList = open && options.length > 0;
  return (
    <form
      role="search"
      action="/search"
      className="relative mx-1 flex min-w-0 flex-1 sm:mx-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (active >= 0 && options[active]) {
          const o = options[active];
          go(o.href, o.kind === "recent" ? o.text : undefined);
        } else if (q.trim()) {
          go(`/search?q=${encodeURIComponent(q.trim())}`, q.trim());
        }
      }}
    >
      <label htmlFor={`${id}-input`} className="sr-only">
        {t("label")}
      </label>
      <div className="flex w-full items-center rounded-full border border-line bg-bg px-3 transition focus-within:border-brand focus-within:bg-surface focus-within:shadow-card">
        <Icon name="search" size={18} className="shrink-0 text-muted" />
        <input
          id={`${id}-input`}
          name="q"
          type="search"
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${id}-${options[active]?.id}` : undefined}
          placeholder={t("placeholder")}
          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((a) => Math.min(a + 1, options.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, -1));
            } else if (e.key === "Escape") {
              setOpen(false);
              setActive(-1);
            }
          }}
        />
      </div>
      <button type="submit" className="sr-only">
        {t("label")}
      </button>
      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("suggestions")}
          className="menu-panel pop absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-elevated p-1.5 shadow-lift"
        >
          {options.map((o, i) => (
            <li
              key={o.id}
              id={`${id}-${o.id}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                go(o.href, o.kind === "recent" ? o.text : undefined);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm ${i === active ? "bg-brand-soft text-brand" : ""}`}
            >
              {o.kind === "product" && o.cover ? (
                // eslint-disable-next-line @next/next/no-img-element -- small thumbnail already sized by the API
                <img src={o.cover} alt="" className="size-9 rounded-lg object-cover" />
              ) : (
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-bg text-muted">
                  <Icon
                    name={
                      o.kind === "recent"
                        ? "clock"
                        : o.kind === "category"
                          ? "grid"
                          : o.kind === "brand"
                            ? "star"
                            : "search"
                    }
                    size={16}
                  />
                </span>
              )}
              <span className="min-w-0 flex-1 truncate">
                {o.text}
                {o.brand && <span className="ml-1.5 text-xs text-muted">{o.brand}</span>}
              </span>
              <span className="text-xs text-muted">{t(`kind.${o.kind}`)}</span>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
