"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Brand } from "@/components/brand";

let latchedToken = "";
let activeMounts = 0;

function subscribeToHash(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function readTokenFromHash() {
  const fromHash =
    new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
  if (fromHash) {
    latchedToken = fromHash;
  }
  return latchedToken;
}

function getServerToken() {
  return "";
}

export function AttendanceClaim() {
  const token = useSyncExternalStore(
    subscribeToHash,
    readTokenFromHash,
    getServerToken,
  );
  const [state, setState] = useState("Checking your attendance session…");
  const [kind, setKind] = useState<"busy" | "success" | "error" | "signin">(
    "busy",
  );

  useEffect(() => {
    activeMounts += 1;
    return () => {
      activeMounts -= 1;
      window.setTimeout(() => {
        if (activeMounts === 0) {
          latchedToken = "";
        }
      }, 0);
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    window.history.replaceState(null, "", "/attendance/claim");
    let active = true;
    void fetch("/api/attendance/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
    })
      .then(async (response) => ({
        response,
        body: (await response.json()) as { status?: string; error?: string },
      }))
      .then(({ response, body }) => {
        if (!active) return;
        if (response.status === 401) {
          setKind("signin");
          setState(
            "Sign in with your student account, then scan the QR code again.",
          );
          return;
        }
        if (!response.ok)
          throw new Error(body.error ?? "This QR code is invalid or expired.");
        setKind("success");
        setState(
          body.status === "already_recorded"
            ? "You are already checked in for this session."
            : "Attendance recorded. You’re all set!",
        );
      })
      .catch((error: unknown) => {
        if (active) {
          setKind("error");
          setState(
            error instanceof Error
              ? error.message
              : "We couldn’t record attendance. Please scan again.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [token]);

  const statusKind = token ? kind : "error";

  return (
    <main className="grid min-h-screen place-items-center px-5">
      <div className="surface w-full max-w-md p-8 text-center">
        <div className="mb-9 flex justify-center">
          <Link href="/">
            <Brand />
          </Link>
        </div>
        <div
          className={`mx-auto grid size-14 place-items-center rounded-2xl text-2xl ${statusKind === "success" ? "bg-[#142019] text-[#ff8833]" : statusKind === "error" ? "bg-[#261715] text-[#ff9588]" : "bg-[#171717] text-[#a1a1a1]"}`}
        >
          {statusKind === "success" ? "✓" : statusKind === "error" ? "!" : "⌗"}
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">
          {statusKind === "success"
            ? "You’re checked in"
            : statusKind === "signin"
              ? "Student sign-in needed"
              : statusKind === "error"
                ? "Couldn’t check in"
                : "Recording attendance"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#a1a1a1]" role="status">
          {token
            ? state
            : "No attendance code was found. Scan the QR code again."}
        </p>
        {statusKind === "signin" && (
          <Link className="button mt-6" href="/login">
            Go to sign in <span aria-hidden="true">→</span>
          </Link>
        )}
        {statusKind === "error" && (
          <Link className="button secondary mt-6" href="/student">
            Open student dashboard
          </Link>
        )}
        <p className="mt-8 border-t border-[#262626] pt-5 text-[10px] leading-5 text-[#737373]">
          QR codes expire quickly and can be used once per student for each
          session.
        </p>
      </div>
    </main>
  );
}
