"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { ApiError } from "@/lib/api/client";
import { useInbox, useMarkRead, usePrefs, useSavePrefs, type Prefs } from "@/lib/notifications";
import { Alert, Button, Card } from "@/components/ui/Form";

// /account/notifications: the inbox and channel choices (LLD 13).
export function NotificationsPage() {
  const t = useTranslations("notifications");
  const format = useFormatter();
  const inbox = useInbox();
  const read = useMarkRead();

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
          {(inbox.data?.unread ?? 0) > 0 && (
            <Button variant="secondary" className="min-h-9 px-4" onClick={() => read.mutate([])}>
              {t("markAll")}
            </Button>
          )}
        </div>
        {inbox.isPending && <div className="skeleton h-48" />}
        {inbox.isError && <Alert>{t("loadError")}</Alert>}
        {inbox.data?.items.length === 0 && <p className="text-muted">{t("empty")}</p>}
        <ul className="space-y-2">
          {inbox.data?.items.map((n) => (
            <li key={n.id}>
              <Link
                href={n.link || "#"}
                onClick={() => !n.readAt && read.mutate([n.id])}
                className={`card flex gap-3 p-4 transition hover:border-brand/40 ${n.readAt ? "" : "border-brand/40 bg-brand-soft/30"}`}
              >
                <span
                  aria-hidden
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${n.readAt ? "bg-transparent" : "bg-brand"}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">
                    {n.title}
                    {!n.readAt && <span className="sr-only"> ({t("unread")})</span>}
                  </span>
                  <span className="block text-sm text-muted">{n.body}</span>
                  <span className="block text-xs text-muted">
                    {format.dateTime(new Date(n.createdAt), {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <PrefsCard />
    </div>
  );
}

function PrefsCard() {
  const t = useTranslations("notifications");
  const prefs = usePrefs();
  const save = useSavePrefs();
  if (prefs.isPending) return <div className="skeleton h-48" />;
  if (prefs.isError || !prefs.data) return <Alert>{t("prefsError")}</Alert>;
  const p = prefs.data;
  const toggle = (k: keyof Prefs) => save.mutate({ ...p, [k]: !p[k] });
  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-semibold">{t("prefsTitle")}</h2>
      <p className="text-sm text-muted">{t("alwaysOn")}</p>
      {(["whatsapp", "email", "marketing"] as const).map((k) => (
        <label key={k} className="flex cursor-pointer items-start justify-between gap-3">
          <span className="text-sm">
            <span className="block font-medium">{t(`pref.${k}`)}</span>
            <span className="block text-muted">{t(`prefHint.${k}`)}</span>
          </span>
          <input
            type="checkbox"
            role="switch"
            aria-checked={p[k]}
            checked={p[k]}
            disabled={save.isPending}
            onChange={() => toggle(k)}
            className="mt-1 size-5 accent-[var(--color-brand)]"
          />
        </label>
      ))}
      {save.isError && <Alert>{save.error instanceof ApiError ? save.error.message : t("prefsError")}</Alert>}
    </Card>
  );
}
