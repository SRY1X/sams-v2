import { createClient } from "@supabase/supabase-js";

const demoUsers = [
  {
    email: "admin@sams-v2.example.test",
    password: "SamsDemo!LocalOnly2026",
    name: "Jordan Admin",
    role: "admin",
  },
  {
    email: "faculty@sams-v2.example.test",
    password: "SamsDemo!LocalOnly2026",
    name: "Taylor Faculty",
    role: "faculty",
  },
  {
    email: "student@sams-v2.example.test",
    password: "SamsDemo!LocalOnly2026",
    name: "Avery Student",
    role: "student",
  },
];

const institutionId = "00000000-0000-4000-8000-000000000001";
const sectionId = "00000000-0000-4000-8000-000000000040";
const demoSessionId = "00000000-0000-4000-8000-000000000051";
const demoAttendanceId = "00000000-0000-4000-8000-000000000061";

function requireLocalConfiguration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.demo.local using values from your local Supabase stack.",
    );
  }

  const parsedUrl = new URL(supabaseUrl);
  const loopbackHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  if (
    parsedUrl.protocol !== "http:" ||
    !loopbackHosts.has(parsedUrl.hostname)
  ) {
    throw new Error(
      "Demo accounts may only be seeded into a local loopback Supabase URL (localhost, 127.0.0.1, or ::1). No data was written.",
    );
  }

  return { supabaseUrl, serviceRoleKey };
}

function assertNoError(error, operation) {
  if (error) throw new Error(`${operation}: ${error.message}`);
}

async function findUserByEmail(admin, email) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.listUsers({ page, perPage: 100 });
    assertNoError(error, "Could not list local demo users");

    const existingUser = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );
    if (existingUser) return existingUser;
    if (data.users.length < 100) return null;
  }

  throw new Error(
    "Stopped after 2,000 users while looking up local demo accounts.",
  );
}

async function getOrCreateDemoUser(client, definition) {
  const existingUser = await findUserByEmail(
    client.auth.admin,
    definition.email,
  );
  const { data, error } = existingUser
    ? await client.auth.admin.updateUserById(existingUser.id, {
        password: definition.password,
        email_confirm: true,
        user_metadata: { full_name: definition.name },
      })
    : await client.auth.admin.createUser({
        email: definition.email,
        password: definition.password,
        email_confirm: true,
        user_metadata: { full_name: definition.name },
      });

  assertNoError(
    error,
    `Could not prepare local ${definition.role} demo account`,
  );
  const user = data.user;
  if (!user)
    throw new Error(
      `Supabase did not return the ${definition.role} demo user.`,
    );

  const { error: profileError } = await client
    .from("profiles")
    .upsert(
      { id: user.id, display_name: definition.name },
      { onConflict: "id" },
    );
  assertNoError(profileError, "Could not create the demo profile");

  const { error: membershipError } = await client
    .from("institution_memberships")
    .upsert(
      {
        institution_id: institutionId,
        user_id: user.id,
        role: definition.role,
        status: "active",
      },
      { onConflict: "institution_id,user_id" },
    );
  assertNoError(membershipError, "Could not create the demo membership");

  return user;
}

async function main() {
  const { supabaseUrl, serviceRoleKey } = requireLocalConfiguration();
  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: institutionError } = await client
    .from("institutions")
    .update({
      name: "Open-Source University",
      slug: "open-source-university",
      timezone: "Asia/Kolkata",
    })
    .eq("id", institutionId);
  assertNoError(
    institutionError,
    "Could not configure the local demo institution",
  );

  const users = {};
  for (const definition of demoUsers) {
    users[definition.role] = await getOrCreateDemoUser(client, definition);
  }

  const { error: facultyError } = await client.from("section_faculty").upsert(
    {
      institution_id: institutionId,
      section_id: sectionId,
      faculty_user_id: users.faculty.id,
    },
    { onConflict: "section_id,faculty_user_id" },
  );
  assertNoError(facultyError, "Could not assign the demo faculty member");

  const { error: enrollmentError } = await client.from("enrollments").upsert(
    {
      institution_id: institutionId,
      section_id: sectionId,
      student_user_id: users.student.id,
      status: "active",
    },
    { onConflict: "section_id,student_user_id" },
  );
  assertNoError(enrollmentError, "Could not enroll the demo student");

  const startedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const expiresAt = new Date(startedAt.getTime() + 75 * 60 * 1000);
  const recordedAt = new Date(startedAt.getTime() + 12 * 60 * 1000);
  const { error: sessionError } = await client
    .from("attendance_sessions")
    .upsert(
      {
        id: demoSessionId,
        institution_id: institutionId,
        section_id: sectionId,
        created_by: users.faculty.id,
        status: "closed",
        starts_at: startedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        closed_at: expiresAt.toISOString(),
      },
      { onConflict: "id" },
    );
  assertNoError(sessionError, "Could not create the sample attendance session");

  const { error: attendanceError } = await client
    .from("attendance_records")
    .upsert(
      {
        id: demoAttendanceId,
        institution_id: institutionId,
        session_id: demoSessionId,
        student_user_id: users.student.id,
        recorded_at: recordedAt.toISOString(),
        status: "present",
      },
      { onConflict: "session_id,student_user_id" },
    );
  assertNoError(attendanceError, "Could not create sample attendance history");

  console.log("Local synthetic SAMS demo accounts are ready:");
  for (const definition of demoUsers) {
    console.log(`- ${definition.role}: ${definition.email}`);
  }
  console.log("Password for all three accounts: SamsDemo!LocalOnly2026");
  console.log("Demo data was written to loopback Supabase only.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
