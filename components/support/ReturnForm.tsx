"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { RETURN_REASONS, useRequestReturn, type ReturnReason } from "@/lib/support";
import { Alert, Button } from "@/components/ui/Form";

/** Return or replace one delivered item (UI-BUY-06). */
export function ReturnForm({ orderId, itemId, windowEnds }: { orderId: string; itemId: string; windowEnds?: string }) {
  const t = useTranslations("returns");
  const request = useRequestReturn(orderId);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"RETURN" | "REPLACE">("RETURN");
  const [reason, setReason] = useState<ReturnReason | "">("");
  const [note, setNote] = useState("");

  if (!open) {
    return (
      <Button variant="ghost" className="min-h-9 px-3" onClick={() => setOpen(true)}>
        {t("start")}
      </Button>
    );
  }
  return (
    <form
      className="mt-2 w-full space-y-3 rounded-xl border border-line p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (reason) request.mutate({ itemId, type, reason, note: note.trim() });
      }}
    >
      {windowEnds && (
        <p className="text-xs text-muted">
          {t("windowEnds", {
            date: new Date(windowEnds).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
          })}
        </p>
      )}
      <fieldset className="flex gap-2">
        <legend className="mb-1 text-sm font-medium">{t("want")}</legend>
        {(["RETURN", "REPLACE"] as const).map((v) => (
          <label
            key={v}
            className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${type === v ? "border-brand bg-brand-soft" : "border-line"}`}
          >
            <input
              type="radio"
              name={`type-${itemId}`}
              className="accent-[var(--color-brand)]"
              checked={type === v}
              onChange={() => setType(v)}
            />
            {t(`type.${v}`)}
          </label>
        ))}
      </fieldset>
      <div>
        <label htmlFor={`reason-${itemId}`} className="block text-sm font-medium">
          {t("reason")}
        </label>
        <select
          id={`reason-${itemId}`}
          value={reason}
          onChange={(e) => setReason(e.target.value as ReturnReason)}
          className="mt-1 min-h-11 w-full rounded-xl border border-line bg-surface px-3"
        >
          <option value="">{t("chooseReason")}</option>
          {RETURN_REASONS.map((r) => (
            <option key={r} value={r}>
              {t(`reasons.${r}`)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`note-${itemId}`} className="block text-sm font-medium">
          {t("note")}
        </label>
        <textarea
          id={`note-${itemId}`}
          rows={2}
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 w-full rounded-xl border border-line bg-surface p-2 text-sm"
        />
      </div>
      {request.isError && <Alert>{request.error instanceof ApiError ? request.error.message : t("error")}</Alert>}
      <p className="text-xs text-muted">{t("pickupNote")}</p>
      <div className="flex gap-2">
        <Button type="submit" className="min-h-9 px-4" disabled={!reason || request.isPending}>
          {t("submit")}
        </Button>
        <Button type="button" variant="secondary" className="min-h-9 px-4" onClick={() => setOpen(false)}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
