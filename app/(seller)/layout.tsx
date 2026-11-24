import { RoleGuard } from "@/components/auth/RoleGuard";

// Only SELLER accounts (or an admin viewing as SELLER) see these pages.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <RoleGuard roles={["SELLER"]}>{children}</RoleGuard>;
}
