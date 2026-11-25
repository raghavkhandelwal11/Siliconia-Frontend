"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Button } from "@/components/ui/Form";

/** A short "why?" form that opens in place, used for cancelling. */
export function ReasonForm({
  label,
  confirm,
  busy,
  onSubmit,
  suggestions = [],
}: {
  label: string;
  confirm: string;
  busy: boolean;
  onSubmit: (reason: string) => void;
  suggestions?: string[];
}) {
  const t = useTranslations("orders");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const id = useId();
  if (!open) {
    return (
      <Button variant="ghost" className="min-h-9 px-3 text-danger" onClick={() => setOpen(true)}>
        {label}
      </Button>
    );
  }
  const ok = reason.trim().length >= 3;
  return (
    <form
      className="w-full space-y-2 rounded-xl border border-line p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (ok) onSubmit(reason.trim());
      }}
    >
      <label htmlFor={id} className="block text-sm font-medium">
        {t("reasonLabel")}
      </label>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setReason(s)}
              className={`rounded-full border px-3 py-1 text-xs ${reason === s ? "border-brand bg-brand-soft" : "border-line"}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <textarea
        id={id}
        value={reason}
        maxLength={200}
        rows={2}
        onChange={(e) => setReason(e.target.value)}
        className="w-full rounded-xl border border-line bg-surface p-2 text-sm"
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={!ok || busy} className="min-h-9 bg-none bg-danger px-4">
          {confirm}
        </Button>
        <Button type="button" variant="secondary" className="min-h-9 px-4" onClick={() => setOpen(false)}>
          {t("keep")}
        </Button>
      </div>
    </form>
  );
}
