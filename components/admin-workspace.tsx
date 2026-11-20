import type { ReactNode } from "react";
import { AdminNavigation } from "@/components/admin-navigation";
import { AppHeader } from "@/components/app-header";

export function AdminWorkspace({
  active,
  name,
  institution,
  timezone,
  sidebarNote,
  children,
}: {
  active: string;
  name: string;
  institution: string;
  timezone: string;
  sidebarNote?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="admin-workspace">
      <AppHeader role="admin" name={name} />
      <div className="admin-layout">
        <aside className="admin-sidebar" aria-label="Administration">
          <div className="admin-sidebar-title">
            <span className="admin-mark" aria-hidden="true">
              S
            </span>
            <div className="admin-sidebar-copy">
              <strong>Administration</strong>
              <small title={institution}>{institution}</small>
            </div>
          </div>
          <AdminNavigation active={active} />
          <div className="admin-sidebar-foot">
            {sidebarNote ?? (
              <>
                Workspace timezone
                <br />
                <b>{timezone}</b>
              </>
            )}
          </div>
        </aside>
        {children}
      </div>
    </div>
  );
}
