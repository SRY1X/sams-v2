import Link from "next/link";

const items = [
  ["Overview", "/admin"],
  ["Students", "/admin/students"],
  ["Faculty", "/admin/faculty"],
  ["Branches", "/admin/departments"],
  ["Courses", "/admin/courses"],
  ["Sections", "/admin/sections"],
  ["Terms", "/admin/terms"],
  ["Enrollments", "/admin/enrollments"],
  ["Attendance", "/admin/attendance"],
  ["Activity", "/admin/activity"],
  ["Setup", "/admin/setup"],
] as const;

export function AdminNavigation({ active }: { active: string }) {
  return (
    <nav aria-label="Administration" className="admin-nav">
      {items.map(([label, href]) => {
        const key = href.split("/").at(-1) || "overview";
        const selected = (key === "admin" ? "overview" : key) === active;
        return (
          <Link
            key={href}
            href={href}
            aria-current={selected ? "page" : undefined}
            className={`admin-nav-link${selected ? " is-active" : ""}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
