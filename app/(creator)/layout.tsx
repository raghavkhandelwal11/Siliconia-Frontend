import { RoleGuard } from "@/components/auth/RoleGuard";

// Only CREATOR accounts (or an admin viewing as CREATOR) see these pages.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <RoleGuard roles={["CREATOR"]}>{children}</RoleGuard>;
}
