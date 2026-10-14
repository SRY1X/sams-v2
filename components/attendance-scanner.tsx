"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { IScannerControls } from "@zxing/browser";

type ScanState =
  "idle" | "starting" | "scanning" | "submitting" | "success" | "error";

function subscribeToCameraAvailability() {
  return () => {};
}

function getCameraAvailability() {
  return (
    window.isSecureContext && Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

function getServerCameraAvailability() {
  return null;
}

function getCameraErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (
      error.name === "NotAllowedError" ||
      error.name === "PermissionDeniedError"
    )
      return "Camera access was denied. Allow camera permission for this site, then try again.";
    if (error.name === "NotFoundError")
      return "No camera was found on this device.";
    if (error.name === "NotReadableError")
      return "The camera is busy in another app. Close that app and try again.";
    if (error.name === "SecurityError")
      return "Camera scanning needs a secure HTTPS connection.";
  }
  return "We couldn’t start the camera. Check the site’s camera permission and try again.";
}

function getTokenFromQr(value: string) {
  try {
    const qrUrl = new URL(value);
    if (
      qrUrl.origin !== window.location.origin ||
      qrUrl.pathname !== "/attendance/claim"
    )
      return null;

    const token = new URLSearchParams(qrUrl.hash.slice(1)).get("token");
    return token && token.length <= 1500 ? token : null;
  } catch {
    return null;
  }
}

export function AttendanceScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const scanHandledRef = useRef(false);
  const scanRunRef = useRef(0);
  const cameraAvailable = useSyncExternalStore(
    subscribeToCameraAvailability,
    getCameraAvailability,
    getServerCameraAvailability,
  );
  const [state, setState] = useState<ScanState>("idle");
  const [message, setMessage] = useState("");
  const [needsSignIn, setNeedsSignIn] = useState(false);

  useEffect(() => {
    return () => {
      scanRunRef.current += 1;
      controlsRef.current?.stop();
    };
  }, []);

  async function submitScannedQr(value: string) {
    const token = getTokenFromQr(value);
    if (!token) {
      setState("error");
      setMessage("That isn’t a valid QR code for this SAMS workspace.");
      scanHandledRef.current = false;
      return;
    }

    setState("submitting");
    setMessage("Checking your attendance…");
    try {
      const response = await fetch("/api/attendance/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        cache: "no-store",
      });
      const body = (await response.json()) as {
        status?: string;
        error?: string;
      };

      if (response.status === 401) {
        setState("error");
        setNeedsSignIn(true);
        setMessage(
          "Your sign-in expired. Sign in, then scan the QR code again.",
        );
        return;
      }
      if (!response.ok) {
        setState("error");
        setMessage(body.error ?? "This QR code is invalid or has expired.");
        scanHandledRef.current = false;
        return;
      }

      setState("success");
      setMessage(
        body.status === "already_recorded"
          ? "You’re already checked in for this session."
          : "Attendance recorded. You’re all set!",
      );
    } catch {
      setState("error");
      setMessage(
        "We couldn’t reach SAMS. Check your connection and scan again.",
      );
      scanHandledRef.current = false;
    }
  }

  async function startCamera() {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setState("error");
      setMessage("In-browser camera scanning requires HTTPS on this device.");
      return;
    }
    if (!videoRef.current) return;

    const scanRun = ++scanRunRef.current;
    scanHandledRef.current = false;
    setNeedsSignIn(false);
    setState("starting");
    setMessage("Requesting camera access…");
    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const reader = new BrowserQRCodeReader();
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, _error, scanControls) => {
          if (
            !result ||
            scanHandledRef.current ||
            scanRunRef.current !== scanRun
          )
            return;
          scanHandledRef.current = true;
          scanControls.stop();
          controlsRef.current = null;
          void submitScannedQr(result.getText());
        },
      );
      if (scanRunRef.current !== scanRun) {
        controls.stop();
        return;
      }
      controlsRef.current = controls;
      if (scanHandledRef.current) controls.stop();
      else {
        setState("scanning");
        setMessage("Camera ready. Hold the QR code inside the frame.");
      }
    } catch (error) {
      if (scanRunRef.current !== scanRun) return;
      controlsRef.current?.stop();
      controlsRef.current = null;
      setState("error");
      setMessage(getCameraErrorMessage(error));
    }
  }

  function stopCamera() {
    scanRunRef.current += 1;
    controlsRef.current?.stop();
    controlsRef.current = null;
    if (state === "scanning" || state === "starting") {
      setState("idle");
      setMessage("Camera stopped.");
    }
  }

  return (
    <section className="surface mt-7 p-5 sm:p-7">
      <div className="relative mt-1 aspect-[4/3] overflow-hidden rounded-xl border border-[#262626] bg-black">
        <video
          ref={videoRef}
          className={`size-full object-cover ${state === "scanning" ? "" : "hidden"}`}
          aria-label="Camera preview for scanning an attendance QR code"
          autoPlay
          muted
          playsInline
        />
        {state !== "scanning" && (
          <div className="absolute inset-0 grid place-items-center px-6 text-center">
            <div>
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#171717] text-2xl text-[#ff8833]">
                ⌗
              </span>
              <p className="mt-4 text-sm font-semibold">
                {state === "success" ? "Check-in complete" : "Camera scanner"}
              </p>
              <p className="mt-2 text-xs leading-5 text-[#a1a1a1]">
                {cameraAvailable === false
                  ? "Camera access needs HTTPS. For this local preview, use your phone’s Camera app to scan the QR displayed on your instructor’s screen."
                  : "Your camera is used to read the QR code on this device. Video is not uploaded."}
              </p>
            </div>
          </div>
        )}
        {state === "scanning" && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="size-[58%] rounded-2xl border-2 border-[#ff8833] shadow-[0_0_0_999px_rgb(0_0_0_/_28%)]" />
          </div>
        )}
      </div>

      <p
        className="mt-4 min-h-10 text-sm text-[#a1a1a1]"
        role="status"
        aria-live="polite"
      >
        {message ||
          (cameraAvailable === null
            ? "Checking camera availability…"
            : cameraAvailable
              ? "Ready when you are. Camera access starts only after you tap below."
              : "In-app scanning is unavailable over this local HTTP address.")}
      </p>

      <div className="mt-3 flex flex-wrap gap-3">
        {state === "scanning" || state === "starting" ? (
          <button
            className="button secondary"
            type="button"
            onClick={stopCamera}
          >
            Stop camera
          </button>
        ) : state === "success" ? (
          <Link className="button" href="/student">
            Return to dashboard
          </Link>
        ) : (
          <button
            className="button"
            type="button"
            onClick={() => void startCamera()}
            disabled={cameraAvailable !== true || state === "submitting"}
          >
            {state === "submitting"
              ? "Recording attendance…"
              : cameraAvailable === false
                ? "Camera requires HTTPS"
                : "Start QR scanner"}
          </button>
        )}
        <Link className="button secondary" href="/student">
          Back to dashboard
        </Link>
        {needsSignIn && (
          <Link className="button" href="/login?next=/student/scan">
            Sign in again
          </Link>
        )}
      </div>

      {state === "error" && message && (
        <p className="error-box mt-4" role="alert">
          {message}
          {cameraAvailable === false && (
            <span className="mt-2 block">
              For local testing, open your phone’s Camera app and scan the QR on
              the faculty screen. Tap the SAMS link to check in.
            </span>
          )}
        </p>
      )}
    </section>
  );
}
