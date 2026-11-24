import { RoleGuard } from "@/components/auth/RoleGuard";

// Only PROMOTER accounts (or an admin viewing as PROMOTER) see these pages.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <RoleGuard roles={["PROMOTER"]}>{children}</RoleGuard>;
}
