"use client";

import { useEffect, useState } from "react";
import { formatInstitutionDateTime } from "@/lib/config/format";
import { LIVE_ATTENDANCE_REFRESH_MS } from "@/lib/attendance/constants";

type RecordRow = {
  id: string;
  name: string;
  recordedAt: string;
  status: string;
};
export function LiveAttendanceList({
  sessionId,
  timezone,
}: {
  sessionId: string;
  timezone: string;
}) {
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let active = true;
    let timer = 0;
    let fetching = false;
    async function refresh() {
      if (!active || fetching || document.hidden) return;
      fetching = true;
      try {
        const response = await fetch(
          `/api/attendance/sessions/${sessionId}/records`,
          { cache: "no-store" },
        );
        if (!response.ok) throw new Error("unavailable");
        const body = (await response.json()) as { records: RecordRow[] };
        if (active) {
          setRecords(body.records);
          setUnavailable(false);
        }
      } catch {
        if (active) setUnavailable(true);
      } finally {
        fetching = false;
        if (active && !document.hidden) {
          timer = window.setTimeout(
            () => void refresh(),
            LIVE_ATTENDANCE_REFRESH_MS,
          );
        }
      }
    }
    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        window.clearTimeout(timer);
        void refresh();
      }
    }
    void refresh();
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      active = false;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [sessionId]);
  return (
    <div className="overflow-hidden rounded-xl border border-[#262626]">
      <div className="flex items-center justify-between bg-[#171717] px-4 py-3">
        <div>
          <p className="text-xs font-bold">Live check-ins</p>
          <p className="mt-1 text-[10px] text-[#a1a1a1]">
            Updates every 2 seconds while this page is open.
          </p>
        </div>
        <span className="badge">{records.length} present</span>
      </div>
      {unavailable && (
        <p className="px-4 py-2 text-[10px] text-[#ff9588]">
          Could not refresh check-ins. Retrying automatically.
        </p>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Recorded</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>
                  <b>{record.name}</b>
                </td>
                <td>
                  {formatInstitutionDateTime(record.recordedAt, timezone)}
                </td>
                <td>
                  <span className="badge">Present</span>
                </td>
              </tr>
            ))}
            {!records.length && (
              <tr>
                <td
                  colSpan={3}
                  className="py-12 text-center text-xs text-[#a1a1a1]"
                >
                  Waiting for students to scan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
