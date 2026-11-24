"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api/client";
import { StatusChip } from "@/components/ui/StatusChip";

// Shows whether the web app can reach the API (M0 "done when" check).
export function ApiStatus() {
  const t = useTranslations();
  const { data, isPending, isError } = useQuery({
    queryKey: ["healthz"],
    queryFn: async () => {
      const { data, error } = await api.GET("/healthz");
      if (error || !data) throw new Error("API not reachable");
      return data;
    },
  });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="font-medium">{t("home.apiStatus")}</span>
      {isPending ? (
        <StatusChip tone="neutral" icon="clock">
          {t("status.checking")}
        </StatusChip>
      ) : isError ? (
        <StatusChip tone="danger">{t("status.down")}</StatusChip>
      ) : (
        <>
          <StatusChip tone="success">{t("status.ok")}</StatusChip>
          <span className="text-sm text-muted">{t("home.apiVersion", { version: data.version, mode: data.mode })}</span>
        </>
      )}
    </div>
  );
}
