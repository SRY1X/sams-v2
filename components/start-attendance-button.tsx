"use client";

import { useFormStatus } from "react-dom";

/** Gives immediate feedback while a faculty attendance session is being created. */
export function StartAttendanceButton() {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      className="button !min-h-9 !px-3 !text-[11px]"
      disabled={pending}
      type="submit"
    >
      {pending ? "Starting…" : "Start attendance"}
      {!pending && <span aria-hidden="true">→</span>}
    </button>
  );
}
