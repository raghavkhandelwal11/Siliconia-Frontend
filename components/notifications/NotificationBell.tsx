"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useSession } from "@/lib/auth/session";
import { useInbox, useLiveInbox } from "@/lib/notifications";
import { Icon } from "@/components/ui/Icon";

// Header bell with a live unread count (UI-GLB-02, LLD 13).
export function NotificationBell({ className = "" }: { className?: string }) {
  const t = useTranslations("shell");
  const session = useSession();
  const signedIn = session.data?.state === "signed-in";
  const inbox = useInbox(signedIn);
  useLiveInbox(signedIn);
  const n = signedIn ? (inbox.data?.unread ?? 0) : 0;
  return (
    <Link
      href="/account/notifications"
      className={`relative size-10 items-center justify-center rounded-full text-muted transition hover:bg-bg hover:text-ink ${className}`}
      aria-label={n > 0 ? t("notificationsCount", { n }) : t("notifications")}
    >
      <Icon name="bell" />
      {n > 0 && (
        <span
          key={n}
          className="pop absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-danger px-1 text-center text-[11px] font-bold leading-5 text-white"
        >
          {n > 99 ? "99+" : n}
        </span>
      )}
    </Link>
  );
}
