import { useTranslations } from "next-intl";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { BottomNav } from "./BottomNav";
import { TestModeBanner } from "./TestModeBanner";

// Global shell on every page (UI-GLB-01 … 11): skip link, TEST MODE banner,
// header, main content, footer and the phone bottom navigation.
export function AppShell({ children, testMode }: { children: React.ReactNode; testMode: boolean }) {
  const t = useTranslations("shell");
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2"
      >
        {t("skipToContent")}
      </a>
      {testMode && <TestModeBanner />}
      <Header />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 md:pb-12">
        {children}
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
