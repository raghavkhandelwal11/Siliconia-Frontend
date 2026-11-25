"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { checkPin, deliveryDate, rememberPin, savedPin, type Serviceability } from "@/lib/shipping";
import { Icon } from "@/components/ui/Icon";

/** "Check delivery" on the product page (UI-PUB-05): ETA and COD for a PIN. */
export function PinCheck() {
  const t = useTranslations("shipping");
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<Serviceability | null>(null);
  const [state, setState] = useState<"idle" | "busy" | "error" | "invalid">("idle");

  async function run(value: string) {
    if (!/^[1-9][0-9]{5}$/.test(value)) {
      setState("invalid");
      setResult(null);
      return;
    }
    setState("busy");
    try {
      setResult(await checkPin(value));
      rememberPin(value);
      setState("idle");
    } catch {
      setResult(null);
      setState("error");
    }
  }

  return (
    <div className="rounded-xl border border-line p-3">
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void run(pin);
        }}
      >
        <Icon name="truck" size={18} className="shrink-0 text-brand" />
        <label htmlFor="pin-check" className="sr-only">
          {t("pinLabel")}
        </label>
        <input
          id="pin-check"
          inputMode="numeric"
          maxLength={6}
          placeholder={t("pinPlaceholder")}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          onFocus={() => {
            if (!pin) setPin(savedPin());
          }}
          className="min-h-10 w-full min-w-0 rounded-lg bg-transparent px-2 text-sm outline-none placeholder:text-muted/70"
        />
        <button
          type="submit"
          disabled={state === "busy"}
          className="shrink-0 text-sm font-semibold text-brand disabled:opacity-50"
        >
          {t("check")}
        </button>
      </form>
      <div aria-live="polite" className="text-sm">
        {state === "invalid" && <p className="mt-2 text-danger">{t("invalid")}</p>}
        {state === "error" && <p className="mt-2 text-muted">{t("unavailable")}</p>}
        {result && state === "idle" && (
          <div className="mt-2 space-y-0.5">
            {result.deliverable ? (
              <>
                <p className="font-semibold text-success">{t("deliveryBy", { date: deliveryDate(result.etaDays) })}</p>
                <p className="text-muted">{result.cod ? t("codAvailable") : t("prepaidOnly")}</p>
              </>
            ) : (
              <p className="font-semibold text-danger">{t("notServed")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
