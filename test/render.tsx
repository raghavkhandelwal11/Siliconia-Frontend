import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import messages from "@/messages/en.json";

// Renders with the same providers as the app: translations and TanStack Query.
export function renderWithProviders(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="Asia/Kolkata">
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    </NextIntlClientProvider>,
  );
}
