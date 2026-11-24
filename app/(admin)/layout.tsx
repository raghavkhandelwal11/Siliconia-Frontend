import { RoleGuard } from "@/components/auth/RoleGuard";

// Only ADMIN accounts (or an admin viewing as ADMIN) see these pages.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <RoleGuard roles={["ADMIN"]}>{children}</RoleGuard>;
}
