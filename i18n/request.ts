import { getRequestConfig } from "next-intl/server";

// English only for now; all text lives in messages/<locale>.json so Hindi can
// be added without code changes (TRS A-01, NFR-ACC-06).
export const defaultLocale = "en";

export default getRequestConfig(async () => {
  const locale = defaultLocale;
  return {
    locale,
    timeZone: "Asia/Kolkata",
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
