"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { useSaveAddress, type Address, type AddressInput } from "@/lib/checkout";
import { Alert, Button, Field } from "@/components/ui/Form";

const STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const empty: AddressInput = {
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  isDefault: false,
};

/** Add or edit a delivery address (UI-BUY-02). */
export function AddressForm({
  address,
  onSaved,
  onCancel,
}: {
  address?: Address;
  onSaved: (a: Address) => void;
  onCancel?: () => void;
}) {
  const t = useTranslations("addresses");
  const save = useSaveAddress();
  const [v, setV] = useState<AddressInput>(address ? { ...address } : empty);
  const [errors, setErrors] = useState<Partial<Record<keyof AddressInput, string>>>({});
  const set = (k: keyof AddressInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV({ ...v, [k]: e.target.value });

  function validate(): boolean {
    const e: typeof errors = {};
    if (v.name.trim().length < 2) e.name = t("errors.name");
    if (!/^[6-9][0-9]{9}$/.test(v.phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, ""))) e.phone = t("errors.phone");
    if (!v.line1.trim()) e.line1 = t("errors.required");
    if (!v.city.trim()) e.city = t("errors.required");
    if (!v.state) e.state = t("errors.required");
    if (!/^[1-9][0-9]{5}$/.test(v.pincode)) e.pincode = t("errors.pincode");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (validate()) save.mutate({ id: address?.id, input: v }, { onSuccess: onSaved });
      }}
    >
      <Field label={t("name")} value={v.name} onChange={set("name")} error={errors.name} autoComplete="name" />
      <Field
        label={t("phone")}
        prefix="+91"
        inputMode="numeric"
        value={v.phone}
        onChange={set("phone")}
        error={errors.phone}
        autoComplete="tel-national"
      />
      <Field
        className="sm:col-span-2"
        label={t("line1")}
        value={v.line1}
        onChange={set("line1")}
        error={errors.line1}
        autoComplete="address-line1"
      />
      <Field
        className="sm:col-span-2"
        label={t("line2")}
        value={v.line2 ?? ""}
        onChange={set("line2")}
        autoComplete="address-line2"
      />
      <Field
        label={t("pincode")}
        inputMode="numeric"
        maxLength={6}
        value={v.pincode}
        onChange={set("pincode")}
        error={errors.pincode}
        autoComplete="postal-code"
      />
      <Field
        label={t("city")}
        value={v.city}
        onChange={set("city")}
        error={errors.city}
        autoComplete="address-level2"
      />
      <div>
        <label htmlFor="address-state" className="block text-sm font-medium">
          {t("state")}
        </label>
        <select
          id="address-state"
          value={v.state}
          onChange={set("state")}
          aria-invalid={errors.state ? true : undefined}
          className="mt-1.5 min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-base"
        >
          <option value="">{t("chooseState")}</option>
          {STATES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        {errors.state && <p className="mt-1 text-sm text-danger">{errors.state}</p>}
      </div>
      <label className="flex items-center gap-2 self-end pb-3 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-[var(--color-brand)]"
          checked={v.isDefault ?? false}
          onChange={(e) => setV({ ...v, isDefault: e.target.checked })}
        />
        {t("makeDefault")}
      </label>
      {save.isError && (
        <div className="sm:col-span-2">
          <Alert>{save.error instanceof ApiError ? save.error.message : t("errors.save")}</Alert>
        </div>
      )}
      <div className="flex gap-3 sm:col-span-2">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? t("saving") : t("save")}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t("cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
