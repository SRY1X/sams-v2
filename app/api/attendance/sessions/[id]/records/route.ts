import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getMembership } from "@/lib/auth/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = (await params).id;
  if (!z.uuid().safeParse(id).success)
    return NextResponse.json({ error: "not_available" }, { status: 404 });
  const member = await getMembership();
  if (!member || !["faculty", "admin"].includes(member.role))
    return NextResponse.json({ error: "not_available" }, { status: 404 });
  const [{ data: session }, { data: allowed }] = await Promise.all([
    member.supabase
      .from("attendance_sessions")
      .select("id,institution_id,status,section_id")
      .eq("id", id)
      .maybeSingle(),
    member.supabase.rpc("can_manage_attendance_session", { p_session_id: id }),
  ]);
  if (!session || session.institution_id !== member.institution_id || !allowed)
    return NextResponse.json({ error: "not_available" }, { status: 404 });
  const { data: records } = await member.supabase
    .from("attendance_records")
    .select("id,student_user_id,recorded_at,status")
    .eq("session_id", id)
    .order("recorded_at", { ascending: true });
  const ids = [
    ...new Set((records ?? []).map((record) => record.student_user_id)),
  ];
  const { data: profiles } = ids.length
    ? await member.supabase
        .from("profiles")
        .select("id,display_name")
        .in("id", ids)
    : { data: [] };
  const { data: institution } = await member.supabase
    .from("institutions")
    .select("timezone")
    .eq("id", session.institution_id)
    .maybeSingle();
  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.display_name]),
  );
  return NextResponse.json(
    {
      timezone: institution?.timezone ?? "UTC",
      records: (records ?? []).map((record) => ({
        id: record.id,
        name: profileMap.get(record.student_user_id) ?? "Student",
        recordedAt: record.recorded_at,
        status: record.status,
      })),
    },
    { headers: { "Cache-Control": "no-store, private", Pragma: "no-cache" } },
  );
}
