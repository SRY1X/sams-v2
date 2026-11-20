import Link from "next/link";
import { signOut } from "@/lib/auth/actions";
import type { Role } from "@/lib/database.types";
import { Brand } from "@/components/brand";

const roleHome: Record<Role, string> = {
  student: "/student",
  faculty: "/faculty",
  admin: "/admin",
};

export function AppHeader({
  role,
  name,
  active,
}: {
  role: Role;
  name: string;
  active?: "overview" | "scan" | "history" | "sections";
}) {
  const root = roleHome[role];
  return (
    <header className="app-header">
      <div className="shell app-header-inner">
        <Link href={root} className="app-brand" aria-label="SAMS V2 home">
          <Brand />
        </Link>
        {role !== "admin" && (
          <nav className="app-role-nav" aria-label="Primary navigation">
            <Link
              href={root}
              className={active === "overview" ? "is-active" : undefined}
              aria-current={active === "overview" ? "page" : undefined}
            >
              Overview
            </Link>
            {role === "student" ? (
              <>
                <Link
                  href="/student/scan"
                  className={active === "scan" ? "is-active" : undefined}
                  aria-current={active === "scan" ? "page" : undefined}
                >
                  Scan QR
                </Link>
                <Link
                  href="/student/history"
                  className={active === "history" ? "is-active" : undefined}
                  aria-current={active === "history" ? "page" : undefined}
                >
                  Attendance history
                </Link>
              </>
            ) : (
              <Link
                href="/faculty#sections"
                className={active === "sections" ? "is-active" : undefined}
                aria-current={active === "sections" ? "page" : undefined}
              >
                My sections
              </Link>
            )}
          </nav>
        )}
        <div className="app-header-actions">
          <span className="app-user">
            <span className="app-user-name">{name}</span>
            <span className="app-user-role">{role}</span>
          </span>
          <form action={signOut}>
            <button className="button secondary app-sign-out" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
