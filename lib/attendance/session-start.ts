export type SessionStartErrorKind =
  "inactive-term" | "already-open" | "unavailable";

type SessionStartDatabaseError = {
  code?: string;
  message?: string;
} | null;

/** Maps expected database guards to safe, actionable UI states. */
export function classifySessionStartError(
  error: SessionStartDatabaseError,
): SessionStartErrorKind {
  if (error?.code === "55000") {
    const message = error.message?.toLowerCase() ?? "";
    if (message.includes("academic term is not active")) return "inactive-term";
    if (message.includes("session is already active")) return "already-open";
  }

  return "unavailable";
}

/** Checks the academic term using inclusive ISO calendar dates. */
export function isAcademicTermActive(
  startsOn: string,
  endsOn: string,
  localDate: string,
): boolean {
  return startsOn <= localDate && localDate <= endsOn;
}

/** Returns today's YYYY-MM-DD calendar date in the institution's time zone. */
export function getDateInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
}
