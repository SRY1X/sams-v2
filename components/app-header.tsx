import Link from "next/link";
import { signOut } from "@/lib/auth/actions";
import type { Role } from "@/lib/database.types";
import { Brand } from "@/components/brand";

const roleHome: Record<Role, string> = {
  student: "/student",
  faculty: "/faculty",
  admin: "/admin",
};

export function AppHeader({ role, name }: { role: Role; name: string }) {
  const root = roleHome[role];
  return (
    <header className="border-b border-[#262626] bg-[#171717]">
      <div className="shell flex min-h-[72px] items-center justify-between gap-4">
        <Link href={root} aria-label="SAMS V2 home">
          <Brand />
        </Link>
        <nav
          className="hidden items-center gap-7 text-[12px] font-semibold text-[#a1a1a1] sm:flex"
          aria-label="Main navigation"
        >
          <Link href={root} className="hover:text-[#ff8833]">
            Overview
          </Link>
          {role === "student" && (
            <Link href="/student/history" className="hover:text-[#ff8833]">
              Attendance history
            </Link>
          )}
          {role === "faculty" && (
            <Link href="/faculty" className="hover:text-[#ff8833]">
              My sections
            </Link>
          )}
          {role === "admin" && (
            <Link href="/admin" className="hover:text-[#ff8833]">
              Institution setup
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden text-right sm:block">
            <span className="block text-[12px] font-bold">{name}</span>
            <span className="block text-[10px] capitalize text-[#a1a1a1]">
              {role}
            </span>
          </span>
          <form action={signOut}>
            <button
              className="button secondary !min-h-9 !px-3 !text-[11px]"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
