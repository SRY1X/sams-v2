export function selectActiveSession<T extends { id: string }>(
  sessions: readonly T[],
  selectedSessionId: string,
): T | null {
  return (
    sessions.find((session) => session.id === selectedSessionId) ??
    sessions[0] ??
    null
  );
}

export function filterAttendanceByCourse<T extends { session_id: string }>(
  records: readonly T[],
  sessionsById: ReadonlyMap<string, { section_id: string }>,
  sectionsById: ReadonlyMap<string, { course_id: string }>,
  courseId: string,
): T[] {
  if (!courseId) return [...records];

  return records.filter((record) => {
    const session = sessionsById.get(record.session_id);
    const section = session ? sectionsById.get(session.section_id) : undefined;
    return section?.course_id === courseId;
  });
}
