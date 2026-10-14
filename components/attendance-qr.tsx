"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { DEFAULT_QR_ROTATION_SECONDS } from "@/lib/attendance/constants";

type TokenResult = { url: string; expiresAt: number; rotateAfterMs?: number };
const EXPIRED_QR_RETRY_MS = 2_500;
const QR_EXPIRY_REFRESH_BUFFER_MS = 500;

export function AttendanceQr({ sessionId }: { sessionId: string }) {
  const [token, setToken] = useState<TokenResult | null>(null);
  const [error, setError] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const expiresRef = useRef(0);

  useEffect(() => {
    let alive = true;
    let refreshTimer = 0;
    let refreshing = false;
    async function refresh() {
      if (!alive || refreshing || document.visibilityState === "hidden") return;
      refreshing = true;
      try {
        const response = await fetch(
          `/api/attendance/sessions/${sessionId}/token`,
          { cache: "no-store" },
        );
        if (!response.ok) throw new Error("unavailable");
        const body = (await response.json()) as TokenResult;
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
  }, [sessionId]);

  return (
    <div className="mx-auto w-fit rounded-[10px] bg-white p-3 shadow-sm ring-1 ring-[#262626]">
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
        <div className="grid size-[220px] place-items-center rounded-xl bg-[#171717] text-center text-xs text-[#a1a1a1]">
          {error
            ? "QR refresh unavailable. Try again shortly."
            : "Preparing secure QR…"}
        </div>
      )}
    </div>
  );
}
