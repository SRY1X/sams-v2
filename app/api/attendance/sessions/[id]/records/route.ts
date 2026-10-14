import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getIdentity } from "@/lib/auth/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = (await params).id;
  if (!z.uuid().safeParse(id).success)
    return NextResponse.json({ error: "not_available" }, { status: 404 });
  const identity = await getIdentity();
  if (!identity)
    return NextResponse.json({ error: "not_available" }, { status: 404 });
  const { data: snapshots, error } = await identity.supabase.rpc(
    "get_attendance_session_snapshot",
    { p_session_id: id },
  );
  const snapshot = snapshots?.[0];
  if (error || !snapshot)
    return NextResponse.json({ error: "not_available" }, { status: 404 });
  const records = Array.isArray(snapshot.records) ? snapshot.records : [];
  return NextResponse.json(
    {
      timezone: snapshot.timezone,
      records,
    },
    { headers: { "Cache-Control": "no-store, private", Pragma: "no-cache" } },
  );
}
