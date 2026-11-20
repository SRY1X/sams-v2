export type AttendanceDiagnosticMetricKey =
  | "cameraStartupMs"
  | "qrDecodeMs"
  | "claimRoundTripMs"
  | "authMs"
  | "dbMs"
  | "serverTotalMs"
  | "qrRequestMs"
  | "qrRenderMs"
  | "rosterRequestMs"
  | "rosterRenderMs"
  | "pollIntervalMs"
  | "lastRefreshAgoMs";

export type AttendanceDiagnosticOutcome =
  | "success"
  | "already_recorded"
  | "camera_permission"
  | "camera_unavailable"
  | "decode_timeout"
  | "claim_network"
  | "claim_auth"
  | "claim_rejected";

const metricLabels: Record<AttendanceDiagnosticMetricKey, string> = {
  cameraStartupMs: "Camera startup",
  qrDecodeMs: "QR decode",
  claimRoundTripMs: "Claim round trip",
  authMs: "Server authentication",
  dbMs: "Server database",
  serverTotalMs: "Server total",
  qrRequestMs: "QR token request",
  qrRenderMs: "QR render",
  rosterRequestMs: "Roster request",
  rosterRenderMs: "Roster update",
  pollIntervalMs: "Refresh interval",
  lastRefreshAgoMs: "Since last successful refresh",
};

const outcomeLabels: Record<AttendanceDiagnosticOutcome, string> = {
  success: "Success",
  already_recorded: "Already recorded",
  camera_permission: "Camera permission denied",
  camera_unavailable: "Camera unavailable",
  decode_timeout: "QR not decoded",
  claim_network: "Claim network failure",
  claim_auth: "Sign-in required",
  claim_rejected: "Claim rejected",
};

function formatDuration(durationMs: number) {
  return durationMs >= 1000
    ? `${(durationMs / 1000).toFixed(2)} s`
    : `${durationMs.toFixed(1)} ms`;
}

/** Renders transient timings only when the server page explicitly enables diagnostics. */
export function AttendancePerformanceDiagnostics({
  enabled,
  metrics,
  outcome,
}: {
  enabled: boolean;
  metrics: Partial<Record<AttendanceDiagnosticMetricKey, number | undefined>>;
  outcome?: AttendanceDiagnosticOutcome;
}) {
  if (!enabled) return null;

  const entries = Object.entries(metrics).flatMap(([key, value]) =>
    key in metricLabels && typeof value === "number" && Number.isFinite(value)
      ? [[key as AttendanceDiagnosticMetricKey, value] as const]
      : [],
  );

  return (
    <details className="mt-4 rounded-lg border border-[#393939] bg-[#121212] text-left">
      <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-[#b4b4b4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3ecf8e]">
        Performance diagnostics
      </summary>
      <div className="border-t border-[#2e2e2e] px-3 py-3 text-xs">
        {entries.length ? (
          <dl className="grid grid-cols-1 gap-x-5 gap-y-2 sm:grid-cols-2">
            {entries.map(([key, value]) => (
              <div
                className="flex items-center justify-between gap-3"
                key={key}
              >
                <dt className="text-[#898989]">{metricLabels[key]}</dt>
                <dd className="font-mono text-[#fafafa]">
                  {formatDuration(value)}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-[#898989]">No timings recorded yet.</p>
        )}
        {outcome && (
          <p className="mt-3 border-t border-[#2e2e2e] pt-2 text-[#b4b4b4]">
            Latest result: {outcomeLabels[outcome]}
          </p>
        )}
      </div>
    </details>
  );
}
