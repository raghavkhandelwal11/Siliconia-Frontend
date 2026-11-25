"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import type { components } from "@/lib/api/schema";

type SpecField = components["schemas"]["SpecField"];

// One specification input, chosen by the field's type in the category schema.
export function SpecInput({
  field,
  value,
  error,
  onChange,
}: {
  field: SpecField;
  value: unknown;
  error?: string;
  onChange: (v: unknown) => void;
}) {
  const t = useTranslations("products.editor.specs");
  const id = useId();
  const label = (
    <span className="flex flex-wrap items-center gap-1.5">
      {field.label}
      {field.unit && <span className="text-muted">({field.unit})</span>}
      {field.required && (
        <span className="text-danger" aria-hidden="true">
          *
        </span>
      )}
      {field.main && (
        <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand">{t("main")}</span>
      )}
    </span>
  );
  const box =
    "mt-1.5 min-h-11 w-full rounded-xl border bg-surface px-3 text-base outline-none transition focus:border-brand " +
    (error ? "border-danger" : "border-line");
  const described = error ? `${id}-err` : undefined;

  let control: React.ReactNode;
  switch (field.type) {
    case "number":
      control = (
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step="any"
          min={0}
          className={box}
          value={typeof value === "number" ? value : ""}
          aria-invalid={error ? true : undefined}
          aria-describedby={described}
          aria-required={field.required}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        />
      );
      break;
    case "enum":
      control = (
        <select
          id={id}
          className={box}
          value={typeof value === "string" ? value : ""}
          aria-describedby={described}
          onChange={(e) => onChange(e.target.value || undefined)}
        >
          <option value="">{t("choose")}</option>
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
      break;
    case "boolean":
      control = (
        <select
          id={id}
          className={box}
          value={value === true ? "yes" : value === false ? "no" : ""}
          aria-describedby={described}
          onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value === "yes")}
        >
          <option value="">{t("choose")}</option>
          <option value="yes">{t("yes")}</option>
          <option value="no">{t("no")}</option>
        </select>
      );
      break;
    case "multi": {
      const chosen = Array.isArray(value) ? (value as string[]) : [];
      return (
        <fieldset aria-describedby={described}>
          <legend className="text-sm font-medium">{label}</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {field.options?.map((o) => {
              const on = chosen.includes(o);
              return (
                <label
                  key={o}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition ${on ? "border-brand bg-brand-soft font-semibold text-brand" : "border-line hover:border-brand/40"}`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={on}
                    onChange={() => {
                      const next = on ? chosen.filter((x) => x !== o) : [...chosen, o];
                      onChange(next.length ? next : undefined);
                    }}
                  />
                  {o}
                </label>
              );
            })}
          </div>
          {error && (
            <p id={`${id}-err`} className="mt-1 text-sm text-danger">
              {error}
            </p>
          )}
        </fieldset>
      );
    }
    default:
      control = (
        <input
          id={id}
          className={box}
          maxLength={200}
          value={typeof value === "string" ? value : ""}
          aria-describedby={described}
          onChange={(e) => onChange(e.target.value || undefined)}
        />
      );
  }
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {control}
      {error && (
        <p id={`${id}-err`} className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
