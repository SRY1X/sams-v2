"use client";

import { useEffect, useState } from "react";
import { formatInstitutionDateTime } from "@/lib/config/format";

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
    async function refresh() {
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
      }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 8000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [sessionId]);
  return (
    <div className="overflow-hidden rounded-xl border border-[#262626]">
      <div className="flex items-center justify-between bg-[#171717] px-4 py-3">
        <div>
          <p className="text-xs font-bold">Live check-ins</p>
          <p className="mt-1 text-[10px] text-[#a1a1a1]">
            Refreshes every 8 seconds. Only this section is shown.
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
