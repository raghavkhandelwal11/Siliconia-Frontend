"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { oneLine, useAddresses, useDeleteAddress, type Address } from "@/lib/checkout";
import { Alert, Button, Card } from "@/components/ui/Form";
import { Icon } from "@/components/ui/Icon";
import { AddressForm } from "./AddressForm";

/** The buyer's saved addresses at /account/addresses. */
export function AddressBook() {
  const t = useTranslations("addresses");
  const list = useAddresses();
  const del = useDeleteAddress();
  const [editing, setEditing] = useState<Address | "new" | null>(null);

  if (list.isPending) return <div className="skeleton h-48" />;
  if (list.isError) return <Alert>{t("errors.load")}</Alert>;
  const { items, max } = list.data;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
        {editing === null && items.length < max && (
          <Button onClick={() => setEditing("new")}>
            <Icon name="home" size={18} />
            {t("add")}
          </Button>
        )}
      </div>
      {editing !== null && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold">{editing === "new" ? t("add") : t("edit")}</h2>
          <AddressForm
            address={editing === "new" ? undefined : editing}
            onSaved={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        </Card>
      )}
      {items.length === 0 && editing === null && <p className="text-muted">{t("empty")}</p>}
      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((a) => (
          <li key={a.id} className="card rise space-y-2 p-5">
            <p className="flex items-center gap-2 font-semibold">
              {a.name}
              {a.isDefault && (
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">
                  {t("default")}
                </span>
              )}
            </p>
            <p className="text-sm text-muted">{oneLine(a)}</p>
            <p className="text-sm text-muted">+91 {a.phone}</p>
            <div className="flex gap-2 pt-1">
              <Button variant="ghost" className="min-h-9 px-3" onClick={() => setEditing(a)}>
                {t("editShort")}
              </Button>
              <Button
                variant="ghost"
                className="min-h-9 px-3 text-danger"
                disabled={del.isPending}
                onClick={() => del.mutate(a.id)}
                aria-label={t("deleteFor", { name: a.name })}
              >
                {t("delete")}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
