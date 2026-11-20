"use client";

import { useEffect, useRef, useState } from "react";
import { formatInstitutionDateTime } from "@/lib/config/format";
import { LIVE_ATTENDANCE_REFRESH_MS } from "@/lib/attendance/constants";
import { AttendancePerformanceDiagnostics } from "@/components/attendance/performance-diagnostics";
import type { AttendanceDiagnosticMetricKey } from "@/components/attendance/performance-diagnostics";
import {
  parseAttendanceServerTiming,
  type AttendanceServerTimingBreakdown,
} from "@/lib/attendance/performance";

type RecordRow = {
  id: string;
  name: string;
  recordedAt: string;
  status: string;
};
/** Displays session check-ins with institution-local timestamps and polling while the page is visible. */
export function LiveAttendanceList({
  sessionId,
  timezone,
  diagnosticsEnabled,
}: {
  sessionId: string;
  timezone: string;
  diagnosticsEnabled: boolean;
}) {
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  const [diagnosticMetrics, setDiagnosticMetrics] = useState<
    Partial<Record<AttendanceDiagnosticMetricKey, number | undefined>>
  >({});
  const rosterRenderStartedAtRef = useRef<number | null>(null);
  const lastSuccessfulRefreshAtRef = useRef<number | null>(null);

  useEffect(() => {
    const renderStartedAt = rosterRenderStartedAtRef.current;
    if (!diagnosticsEnabled || renderStartedAt === null) return;
    setDiagnosticMetrics((previous) => ({
      ...previous,
      rosterRenderMs: performance.now() - renderStartedAt,
    }));
    rosterRenderStartedAtRef.current = null;
  }, [diagnosticsEnabled, records]);

  useEffect(() => {
    if (!diagnosticsEnabled) return;
    const ticker = window.setInterval(() => {
      const lastRefreshAt = lastSuccessfulRefreshAtRef.current;
      if (lastRefreshAt === null) return;
      setDiagnosticMetrics((previous) => ({
        ...previous,
        lastRefreshAgoMs: performance.now() - lastRefreshAt,
      }));
    }, 1000);
    return () => window.clearInterval(ticker);
  }, [diagnosticsEnabled]);

  useEffect(() => {
    let active = true;
    let timer = 0;
    let fetching = false;
    /** Fetches the latest roster without overlapping requests and schedules the next visible-page poll. */
    async function refresh() {
      if (!active || fetching || document.hidden) return;
      fetching = true;
      const requestStartedAt = performance.now();
      let serverTiming: AttendanceServerTimingBreakdown | undefined;
      try {
        const response = await fetch(
          `/api/attendance/sessions/${sessionId}/records`,
          { cache: "no-store" },
        );
        serverTiming = parseAttendanceServerTiming(
          response.headers.get("Server-Timing"),
        );
        if (!response.ok) throw new Error("unavailable");
        const body = (await response.json()) as { records: RecordRow[] };
        if (active) {
          if (diagnosticsEnabled) {
            const refreshCompletedAt = performance.now();
            setDiagnosticMetrics((previous) => ({
              ...previous,
              rosterRequestMs: refreshCompletedAt - requestStartedAt,
              authMs: serverTiming?.authMs,
              dbMs: serverTiming?.dbMs,
              serverTotalMs: serverTiming?.serverTotalMs,
              lastRefreshAgoMs: 0,
            }));
            rosterRenderStartedAtRef.current = refreshCompletedAt;
            lastSuccessfulRefreshAtRef.current = refreshCompletedAt;
          }
          setRecords(body.records);
          setUnavailable(false);
        }
      } catch {
        if (active) {
          if (diagnosticsEnabled) {
            setDiagnosticMetrics((previous) => ({
              ...previous,
              rosterRequestMs: performance.now() - requestStartedAt,
              authMs: serverTiming?.authMs,
              dbMs: serverTiming?.dbMs,
              serverTotalMs: serverTiming?.serverTotalMs,
            }));
          }
          setUnavailable(true);
        }
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
    /** Clears the pending poll and requests current check-ins when the page becomes visible. */
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
  }, [diagnosticsEnabled, sessionId]);
  return (
    <>
      <div className="overflow-hidden rounded-xl border border-[#2e2e2e]">
        <div className="flex items-center justify-between bg-[#242424] px-4 py-3">
          <div>
            <p className="text-xs font-bold">Live check-ins</p>
            <p className="mt-1 text-[10px] text-[#b4b4b4]">
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
                    className="py-12 text-center text-xs text-[#b4b4b4]"
                  >
                    Waiting for students to scan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <AttendancePerformanceDiagnostics
        enabled={diagnosticsEnabled}
        metrics={{
          ...diagnosticMetrics,
          ...(diagnosticsEnabled
            ? { pollIntervalMs: LIVE_ATTENDANCE_REFRESH_MS }
            : {}),
        }}
      />
    </>
  );
}
