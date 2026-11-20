export type AttendanceServerTimingBreakdown = {
  authMs: number | undefined;
  dbMs: number | undefined;
  serverTotalMs: number | undefined;
};

const serverTimingHeaderKeys = [
  ["auth", "authMs"],
  ["db", "dbMs"],
  ["total", "totalMs"],
] as const;

/** Enables diagnostics only when the page query contains the exact value `1`. */
export function isAttendanceDiagnosticsEnabled(
  value: string | string[] | undefined,
) {
  return value === "1";
}

/** Builds the claim link while keeping the signed bearer token in the URL fragment. */
export function buildAttendanceClaimUrl(
  siteOrigin: string,
  token: string,
  diagnosticsEnabled: boolean,
) {
  const claimUrl = new URL("/attendance/claim", siteOrigin);
  if (diagnosticsEnabled) claimUrl.searchParams.set("diagnostics", "1");
  claimUrl.hash = new URLSearchParams({ token }).toString();
  return claimUrl.toString();
}

/** Parses the small allowlist emitted by SAMS, treating legacy `app` as inclusive total. */
export function parseAttendanceServerTiming(
  header: string | null,
): AttendanceServerTimingBreakdown {
  const result: AttendanceServerTimingBreakdown = {
    authMs: undefined,
    dbMs: undefined,
    serverTotalMs: undefined,
  };
  if (!header) return result;

  const values = new Map<string, number>();
  const counts = new Map<string, number>();
  const keyMap: Record<string, string> = {
    auth: "authMs",
    db: "dbMs",
    total: "serverTotalMs",
    app: "serverTotalMs",
  };

  for (const entry of header.split(",")) {
    const [rawName, ...parameters] = entry.split(";");
    const name = rawName?.trim().toLowerCase();
    const resultKey = name ? keyMap[name] : undefined;
    if (!resultKey) continue;

    counts.set(resultKey, (counts.get(resultKey) ?? 0) + 1);
    const durationParameter = parameters
      .map((parameter) => parameter.trim())
      .find((parameter) => parameter.startsWith("dur="));
    const durationText = durationParameter?.slice(4);
    if (!durationText || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(durationText))
      continue;

    const duration = Number(durationText);
    if (Number.isFinite(duration) && duration >= 0)
      values.set(resultKey, duration);
  }

  if (counts.get("authMs") === 1) result.authMs = values.get("authMs");
  if (counts.get("dbMs") === 1) result.dbMs = values.get("dbMs");
  if (counts.get("serverTotalMs") === 1)
    result.serverTotalMs = values.get("serverTotalMs");

  return result;
}

/** Formats known, finite duration fields only; arbitrary object keys are ignored. */
export function formatAttendanceServerTiming(
  values: Readonly<Record<string, number | undefined>>,
) {
  return serverTimingHeaderKeys
    .flatMap(([headerKey, valueKey]) => {
      const duration = values[valueKey];
      if (typeof duration !== "number" || !Number.isFinite(duration)) return [];
      if (duration < 0) return [];
      return [`${headerKey};dur=${duration.toFixed(1)}`];
    })
    .join(", ");
}
