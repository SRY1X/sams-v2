# Database and Row Level Security

The initial migration is the authoritative schema. IDs are UUIDs; event times use `timestamptz`; all academic and attendance records carry institution ownership. Composite foreign keys prevent cross-institution course/term/section assignments.

## Tables and relationships

| Table                     | Main columns and relationship                                                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `institutions`            | `id`, `name`, `slug`, `timezone`; owner boundary.                                                                                 |
| `institution_settings`    | `institution_id`, JSON policy settings; one row per institution. Constrained QR rotation, token TTL, and session maximum values.  |
| `profiles`                | `id` references `auth.users.id`; display name only, no copied email. Auth trigger creates the profile.                            |
| `institution_memberships` | `institution_id`, `user_id`, role (`student`, `faculty`, `admin`), status. Unique institution/user pair.                          |
| `departments`             | Institution-owned units; unique name and optional code per institution.                                                           |
| `academic_terms`          | Institution-owned names and date ranges; `starts_on < ends_on`.                                                                   |
| `courses`                 | Institution-owned code/title and optional department FK. Course code is unique per institution.                                   |
| `course_sections`         | Course + term + section code. Composite FKs enforce the same institution for all three.                                           |
| `section_faculty`         | Unique section/faculty assignment; FK requires an institution membership with faculty role.                                       |
| `enrollments`             | Unique section/student pair and active/withdrawn status; FK requires a student membership.                                        |
| `attendance_sessions`     | Section, creator, open/closed state, start/expiry/close times. Partial unique index permits at most one open session per section. |
| `attendance_records`      | Session/student/time/status; unique `(session_id, student_user_id)` prevents duplicate check-ins.                                 |
| `audit_events`            | Actor, institution, action, entity, minimal metadata, server time. No client update/delete policy.                                |

Indexes cover institution membership lookup, active assignments/enrollment, section session history, student attendance history, and institution audit chronology. Add indexes with migrations when query patterns change.

## RLS and grants

RLS is enabled on every public table. Anonymous table access is revoked; authenticated access is explicitly granted and then constrained by policies. The migration also closes PostgreSQL's default grants for future public tables and functions, and removes the default `PUBLIC` function-execution grant for objects created by `postgres`. This prevents project-level Data API defaults from silently granting broad access. Trusted `service_role` defaults remain available for server-only invitation work. Admin academic writes are institution-scoped. Faculty visibility requires an active role and assigned section. Student reads are limited to their membership, enrollment, sections, sessions, and own attendance. Faculty may view names of students enrolled in their assigned sections; admins may view institution members. Attendance records and audit events have no direct client write permission.

`private` helper functions pin `search_path` and are not in the exposed API schema. Atomic attendance functions verify `auth.uid()`, role, assignment/enrollment, session state, and time window before writing. Public RPC wrappers are invoker functions with explicit execute grants. The QR-context and faculty attendance-snapshot RPCs are also invoker functions: they return only the fields needed by the caller and rely on RLS plus an explicit assigned-faculty/admin check. Review every function, grant, and policy when changing the schema. Never authorize from user-editable Auth metadata. Membership roles are provisioned by invitations or a trusted owner bootstrap; admins can suspend/restore other members but cannot change their own role or grant admin through the UI.

Use `supabase test db` plus role-based integration tests for allowed and denied reads/writes. The SQL migration is not a substitute for reviewing the actual project’s Data API grants and RLS settings.
