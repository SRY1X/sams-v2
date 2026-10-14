"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type TokenResult = { url: string; expiresAt: number; rotateAfterMs?: number };

export function AttendanceQr({ sessionId }: { sessionId: string }) {
  const [token, setToken] = useState<TokenResult | null>(null);
  const [error, setError] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const expiresRef = useRef(0);

  useEffect(() => {
    let alive = true;
    let refreshTimer = 0;
    async function refresh() {
      try {
        const response = await fetch(
          `/api/attendance/sessions/${sessionId}/token`,
          { cache: "no-store" },
        );
        if (!response.ok) throw new Error("unavailable");
        const body = (await response.json()) as TokenResult;
        if (alive) {
          setToken(body);
          expiresRef.current = body.expiresAt;
          setError(false);
          refreshTimer = window.setTimeout(
            () => void refresh(),
            body.rotateAfterMs ?? 25_000,
          );
        }
      } catch {
        if (alive) {
          setError(true);
          refreshTimer = window.setTimeout(() => void refresh(), 25_000);
        }
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
    return () => {
      alive = false;
      window.clearTimeout(refreshTimer);
      window.clearInterval(ticker);
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
