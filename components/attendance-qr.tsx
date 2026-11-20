"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { DEFAULT_QR_ROTATION_SECONDS } from "@/lib/attendance/constants";
import { AttendancePerformanceDiagnostics } from "@/components/attendance/performance-diagnostics";
import type { AttendanceDiagnosticMetricKey } from "@/components/attendance/performance-diagnostics";
import {
  parseAttendanceServerTiming,
  type AttendanceServerTimingBreakdown,
} from "@/lib/attendance/performance";

type TokenResult = { url: string; expiresAt: number; rotateAfterMs?: number };
const EXPIRED_QR_RETRY_MS = 2_500;
const QR_EXPIRY_REFRESH_BUFFER_MS = 500;

/** Displays a session QR code and countdown, refreshing tokens while the page is visible. */
export function AttendanceQr({
  sessionId,
  diagnosticsEnabled,
}: {
  sessionId: string;
  diagnosticsEnabled: boolean;
}) {
  const [token, setToken] = useState<TokenResult | null>(null);
  const [error, setError] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [diagnosticMetrics, setDiagnosticMetrics] = useState<
    Partial<Record<AttendanceDiagnosticMetricKey, number | undefined>>
  >({});
  const expiresRef = useRef(0);
  const qrRenderStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    const renderStartedAt = qrRenderStartedAtRef.current;
    if (!diagnosticsEnabled || !token || renderStartedAt === null) return;
    setDiagnosticMetrics((previous) => ({
      ...previous,
      qrRenderMs: performance.now() - renderStartedAt,
    }));
    qrRenderStartedAtRef.current = null;
  }, [diagnosticsEnabled, token]);

  useEffect(() => {
    let alive = true;
    let refreshTimer = 0;
    let refreshing = false;
    /** Fetches one token at a time and schedules rotation before expiry or a retry after failure. */
    async function refresh() {
      if (!alive || refreshing || document.visibilityState === "hidden") return;
      refreshing = true;
      const requestStartedAt = performance.now();
      let serverTiming: AttendanceServerTimingBreakdown | undefined;
      try {
        const response = await fetch(
          `/api/attendance/sessions/${sessionId}/token${diagnosticsEnabled ? "?diagnostics=1" : ""}`,
          { cache: "no-store" },
        );
        serverTiming = parseAttendanceServerTiming(
          response.headers.get("Server-Timing"),
        );
        if (!response.ok) throw new Error("unavailable");
        const body = (await response.json()) as TokenResult;
        if (alive && diagnosticsEnabled) {
          setDiagnosticMetrics((previous) => ({
            ...previous,
            qrRequestMs: performance.now() - requestStartedAt,
            authMs: serverTiming?.authMs,
            dbMs: serverTiming?.dbMs,
            serverTotalMs: serverTiming?.serverTotalMs,
          }));
        }
        const remainingMs = body.expiresAt - Date.now();
        if (remainingMs <= QR_EXPIRY_REFRESH_BUFFER_MS) {
          if (alive) {
            setError(true);
            refreshTimer = window.setTimeout(
              () => void refresh(),
              EXPIRED_QR_RETRY_MS,
            );
          }
          return;
        }
        if (alive) {
          if (diagnosticsEnabled)
            qrRenderStartedAtRef.current = performance.now();
          setToken(body);
          expiresRef.current = body.expiresAt;
          setError(false);
          const refreshInMs = Math.max(
            100,
            Math.min(
              body.rotateAfterMs ?? DEFAULT_QR_ROTATION_SECONDS * 1000,
              remainingMs - QR_EXPIRY_REFRESH_BUFFER_MS,
            ),
          );
          refreshTimer = window.setTimeout(() => void refresh(), refreshInMs);
        }
      } catch {
        if (alive) {
          if (diagnosticsEnabled) {
            setDiagnosticMetrics((previous) => ({
              ...previous,
              qrRequestMs: performance.now() - requestStartedAt,
              authMs: serverTiming?.authMs,
              dbMs: serverTiming?.dbMs,
              serverTotalMs: serverTiming?.serverTotalMs,
            }));
          }
          setError(true);
          refreshTimer = window.setTimeout(
            () => void refresh(),
            EXPIRED_QR_RETRY_MS,
          );
        }
      } finally {
        refreshing = false;
      }
    }
    /** Replaces the pending refresh timer with an immediate fetch when the page becomes visible. */
    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        window.clearTimeout(refreshTimer);
        void refresh();
      }
    }
    void refresh();
    const ticker = window.setInterval(
      () =>
        setSeconds(
          expiresRef.current
            ? Math.max(0, Math.ceil((expiresRef.current - Date.now()) / 1000))
            : 0,
        ),
      1000,
    );
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      alive = false;
      window.clearTimeout(refreshTimer);
      window.clearInterval(ticker);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [diagnosticsEnabled, sessionId]);

  return (
    <>
      <div className="mx-auto w-fit rounded-[10px] bg-white p-3 shadow-sm ring-1 ring-[#2e2e2e]">
        {token && !error ? (
          <>
            <QRCodeSVG
              value={token.url}
              size={196}
              level="M"
              marginSize={2}
              title="Rotating attendance QR code"
            />
            <p className="mt-2 text-center text-[10px] font-semibold text-[#525252]">
              This code expires in about {seconds || 0}s
            </p>
          </>
        ) : (
          <div className="grid size-[220px] place-items-center rounded-xl bg-[#242424] text-center text-xs text-[#b4b4b4]">
            {error
              ? "QR refresh unavailable. Try again shortly."
              : "Preparing secure QR…"}
          </div>
        )}
      </div>
      <AttendancePerformanceDiagnostics
        enabled={diagnosticsEnabled}
        metrics={diagnosticMetrics}
      />
    </>
  );
}
