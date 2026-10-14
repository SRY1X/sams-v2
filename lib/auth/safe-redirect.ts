const redirectBase = "https://sams-v2.invalid";

export function safeInternalPath(
  candidate: string | null | undefined,
  fallback = "/dashboard",
) {
  if (
    !candidate ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    /[\\\u0000-\u001f\u007f]/.test(candidate)
  ) {
    return fallback;
  }

  try {
    const destination = new URL(candidate, redirectBase);
    if (destination.origin !== redirectBase) return fallback;
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return fallback;
  }
}
