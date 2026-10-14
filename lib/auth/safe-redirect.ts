const redirectBase = "https://sams-v2.invalid";

/**
 * Parses a root-relative destination against the app base and returns its normalized path, query, and hash.
 * Returns the caller-provided fallback (which must be a trusted app path) for rejected input.
 */
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
