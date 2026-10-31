<div align="center">

# SAMS V2

### Academic operations and attendance, with clear access boundaries.

An open-source workspace for students, faculty, and academic administrators. The MVP brings course setup and rotating QR attendance into one responsive web application.

[Open the public landing page](https://sams-v2-god-speed2.vercel.app) · [Set up your own instance](#deploy-your-own-instance) · [Contribute](CONTRIBUTING.md)

<br />

[![Quality checks](https://github.com/SRY1X/sams-v2/actions/workflows/quality.yml/badge.svg)](https://github.com/SRY1X/sams-v2/actions/workflows/quality.yml)
[![MIT license](https://img.shields.io/badge/license-MIT-287a57.svg)](LICENSE)
[![Next.js App Router](https://img.shields.io/badge/Next.js-App%20Router-111111?logo=next.js)](https://nextjs.org/docs)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

</div>

---

> **Project status — MVP.** The public landing page is available to browse, but there are no shared demo logins. The homepage's sample workspace is illustrative; it is not live attendance data. Create a separate Supabase project and synthetic accounts for a hands-on demonstration. Review your institution's privacy, security, retention, backup, and accessibility requirements before using real academic records.

## Contents

- [What the MVP includes](#what-the-mvp-includes)
- [How attendance works](#how-attendance-works)
- [Architecture and data boundaries](#architecture-and-data-boundaries)
- [Deploy your own instance](#deploy-your-own-instance)
- [Prepare a synthetic demonstration](#prepare-a-synthetic-demonstration)
- [Security and known limits](#security-and-known-limits)
- [Project layout](#project-layout)
- [Contributing and quality checks](#contributing-and-quality-checks)
- [Documentation, license, and support](#documentation-license-and-support)

## What the MVP includes

| Student                                                                                      | Faculty                                                                                                                   | Administrator                                                                                                                                 |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| See enrolled sections, scan an active attendance QR, and review personal attendance history. | See assigned sections, start or close an attendance session, display its rotating QR, and review the live section roster. | Set up departments, terms, courses, and sections; assign faculty; enroll students; manage member access; and review institution audit events. |

The first installation is intended for **one institution per deployment**. Institution ownership is present throughout the schema, but the MVP does not include an institution-switching interface or a generic academic-structure builder.

The application is built with Next.js App Router, React, strict TypeScript, Tailwind CSS, Supabase Auth and PostgreSQL, and Vercel as the initial host. The UI is built from small components in the repository. Database migrations define data relationships and access rules.

## How attendance works

1. A faculty member starts a session for a section they are assigned to. The database checks membership, assignment, term dates, and the one-open-session rule.
2. The server signs a short-lived HMAC token. The QR changes every **10 seconds** and the default token lifetime is **10 seconds**. Tokens contain session data, not a student's name or email.
3. A signed-in student opens **Scan attendance QR** and scans the instructor's screen. The browser decodes the QR on the device; camera video is not uploaded. A phone's native camera can also open the QR's claim link.
4. The server checks the token and the database independently checks that the student is active, enrolled in that section, and claiming an open session. A database uniqueness constraint allows only one attendance record per student per session.
5. The faculty roster refreshes every two seconds while its page is visible. Students can review their own recorded attendance and history.

Camera-based scanning requires HTTPS and camera permission. Test it on the deployed Vercel HTTPS address; a phone cannot use its camera on an ordinary `http://` LAN address. The QR token has a two-second clock tolerance and sessions have a separate two-hour maximum by default. See [the attendance guide](docs/attendance.md) for the full lifecycle and policy limits.

## Architecture and data boundaries

The application is divided into these responsibilities:

| Area               | Responsibility                                                                                                                                             |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browser            | Displays the role-specific portal, requests camera permission after a user action, and decodes QR codes on-device.                                         |
| Next.js server     | Renders protected pages and handles validated Server Actions and Route Handlers. It checks identity and role before sensitive operations.                  |
| Supabase Auth      | Maintains the signed-in user's session through secure cookies. An Auth account alone does not grant a SAMS role.                                           |
| PostgreSQL         | Stores institution membership, academic structure, sessions, attendance, and audit events. Constraints and Row Level Security enforce the data boundaries. |
| Attendance signing | Keeps the HMAC signing secret on the server. The QR token is transported in a URL fragment, then submitted to the authenticated claim endpoint.            |

The membership row is authoritative for the user's role. The application uses the user's Supabase identity for normal requests; it does not use the service-role key to bypass RLS. Narrow database functions make attendance checks and writes atomic. Vercel hosts the initial deployment, while the domain rules and schema live in the application and PostgreSQL migrations.

### Database model at a glance

| Table                                                         | What it represents                                                                                                     |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `institutions`, `institution_settings`                        | Institution identity, timezone, and constrained attendance policy.                                                     |
| `profiles`, `institution_memberships`                         | Auth-linked display profile and one active or suspended student, faculty, or admin role per institution.               |
| `departments`, `academic_terms`, `courses`, `course_sections` | Institution-owned academic catalog and offerings.                                                                      |
| `section_faculty`, `enrollments`                              | Faculty assignments and student enrollment in a section. Composite foreign keys enforce matching institution and role. |
| `attendance_sessions`, `attendance_records`                   | Session lifecycle and one present record per student per session.                                                      |
| `audit_events`                                                | Institution-scoped record of relevant administrative and attendance actions.                                           |

Every public table has Row Level Security enabled. Students see their own records and enrolled sections; faculty see assigned sections and their attendance; admins manage records within their institution. Database constraints, indexes, grants, helper functions, and policy tests are versioned with the migrations. Read [the schema and RLS guide](docs/database.md) before changing database behavior.

## Deploy your own instance

This is the recommended route for institutions and project demonstrations. It deploys the application on Vercel and uses a Supabase project you control. You need a small local toolchain to apply the versioned migrations; you do **not** need to run a local web server, PostgreSQL instance, Docker Desktop, or WSL for this hosted setup.

### Before you begin

- A GitHub account and a fork of [this repository](https://github.com/SRY1X/sams-v2).
- A Supabase account and a new project for this installation.
- A Vercel account.
- Git and Node.js with npm. SAMS supports Node.js `22.22.2+` in the 22.x line, `24.15.0+` in the 24.x line, or `26.0.0+`. npm is included with Node.js; this repository records npm `12.2.0` and commits its lockfile.
- A password manager for the Supabase database password and generated signing secret.

Get Git from [git-scm.com](https://git-scm.com/downloads) and Node.js from [nodejs.org](https://nodejs.org/en/download). Docker and WSL are not required for this deployment. The Supabase CLI is included as a locked project dependency and is invoked with `npm exec`; a global CLI installation is not needed.

### 1. Fork the repository

On GitHub, select **Fork** and create a copy under your account. Import your fork into Vercel so your deployment and environment variables belong to you. Keep the production branch set to `main`.

### 2. Create a Supabase project

Create a new Supabase project for this institution. Choose a region close to its users and save the database password in your password manager. In **Project Settings → General**, note the project reference. Do not use another institution's project or production data for a demonstration.

### 3. Apply the database migrations

Open a terminal and clone your fork. The following commands work in PowerShell, Windows Terminal, Git Bash, macOS, and Linux:

```sh
git clone https://github.com/YOUR_GITHUB_USERNAME/sams-v2.git
cd sams-v2
npm ci
npm exec -- supabase login
npm exec -- supabase link --project-ref YOUR_SUPABASE_PROJECT_REF
npm exec -- supabase migration list --linked
npm exec -- supabase db push --dry-run --linked
npm exec -- supabase db push --linked
```

Replace `YOUR_GITHUB_USERNAME` and `YOUR_SUPABASE_PROJECT_REF` before running the commands. `supabase login` opens the Supabase CLI authentication flow. `supabase link` selects the remote project and may ask for its database password; do not put the password in the command or in Git.

**Before the final command**, check the project name and reference in the Supabase dashboard. Review the dry-run output and continue only when it lists the migrations you intend to apply to that project. The last command changes the linked remote database. These commands apply files under `supabase/migrations/`; they do not create Auth users, courses, sections, enrollments, or attendance records.

The first migration creates a neutral placeholder institution with this ID:

```text
00000000-0000-4000-8000-000000000001
```

In **Supabase → SQL Editor**, give it your institution's name, a lowercase slug, and an IANA timezone. For India Standard Time, use `Asia/Kolkata`:

```sql
update public.institutions
set name = 'Your Institution',
    slug = 'your-institution',
    timezone = 'Asia/Kolkata'
where id = '00000000-0000-4000-8000-000000000001';
```

Change the example name, slug, and timezone to your own. The slug accepts lowercase letters, numbers, and single hyphens. Examples of other IANA timezones include `America/New_York` and `Europe/London`.

### 4. Create and assign the first users

Keep public sign-up disabled. In **Supabase → Authentication → Users → Add user**, create a separate account for each role you need: one admin, one faculty member, and one student. Confirm each account so it can sign in. Use test addresses you control and unique passwords; never publish shared passwords.

Copy the **User UID** for each account. In **Supabase → SQL Editor**, replace all three role placeholders with the corresponding UUIDs and run:

```sql
insert into public.institution_memberships
  (institution_id, user_id, role, status)
values
  ('00000000-0000-4000-8000-000000000001', 'ADMIN_AUTH_USER_UUID',   'admin',   'active'),
  ('00000000-0000-4000-8000-000000000001', 'FACULTY_AUTH_USER_UUID', 'faculty', 'active'),
  ('00000000-0000-4000-8000-000000000001', 'STUDENT_AUTH_USER_UUID', 'student', 'active')
on conflict (institution_id, user_id) do nothing;
```

The first admin assignment is a trusted owner operation. Verify the UUIDs before running it: the membership role controls access, and users cannot promote themselves in the application. The database creates each `profiles` row when its Auth user is created.

Confirm the role assignments in SQL Editor before proceeding:

```sql
select u.email, m.role, m.status, p.display_name
from public.institution_memberships as m
join auth.users as u on u.id = m.user_id
join public.profiles as p on p.id = m.user_id
where m.institution_id = '00000000-0000-4000-8000-000000000001'
order by m.role;
```

If an account has an existing membership with a different role, stop and verify the account and intended role before making a trusted SQL correction. For more detail, see [authentication and authorization](docs/auth-and-authorization.md).

### 5. Configure and deploy on Vercel

In Vercel, select **Add New → Project**, import your fork, keep the repository root as the project root, and select `main` as the production branch. Next.js should be detected automatically. If you set build options manually, use `npm ci` for installation and `npm run build` for the build command.

Add these environment variables to the **Production** environment before the first deployment:

| Variable                               | Value                                                                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Project URL from Supabase **Project Settings → API**.                                                                     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key from the same Supabase API settings. It is designed for browser use; RLS still determines access.         |
| `ATTENDANCE_TOKEN_SECRET`              | A unique random signing secret. Keep it server-only and use at least 32 random bytes.                                     |
| `NEXT_PUBLIC_SITE_URL`                 | The exact HTTPS origin users will open, such as `https://your-project.vercel.app`. Do not use `localhost` for Production. |

Generate a signing secret in a terminal with Node.js:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Copy the output directly into the Vercel environment variable. Do not commit it, put it in `.env.example`, or share it in issues, screenshots, or logs. If it is ever exposed, replace it in Vercel and redeploy; QR tokens signed with the old value will stop validating.

`SUPABASE_SERVICE_ROLE_KEY` is **not** needed for manual account provisioning. It is optional only if you enable the admin invitation feature. If used, add it as a server-only Vercel variable—never prefix it with `NEXT_PUBLIC_` and never use it for routine user requests.

The basic walkthrough deploys Production only; a second Supabase project is not required to get started. If you enable Vercel Preview deployments, configure Preview deliberately. Do not connect unreviewed preview code to real student records; use an isolated Supabase sandbox for preview data or leave preview builds without working database credentials.

The repository's `vercel.json` initially targets Vercel's Mumbai region (`bom1`) to keep the application close to the original India-region database. If you choose a different Supabase region, review `vercel.json` and select a supported Vercel region close to that database before deploying.

In **Supabase → Authentication → URL Configuration**, set **Site URL** to the Production HTTPS origin and add this callback URL to the redirect allow list:

```text
https://YOUR_VERCEL_DOMAIN/auth/callback
```

Replace `YOUR_VERCEL_DOMAIN` with the host only, without angle brackets. If you later use a custom domain or Vercel Preview sign-in, add the exact callback origin(s) you intend to use. Keep public sign-up disabled. After checking the variables, callback URL, and project reference, deploy from Vercel.

### 6. Add academic data and test each role

Sign in with the admin account and open **Institution setup**. Create records in this order:

1. Department.
2. Academic term with start and end dates.
3. Course, optionally linked to a department.
4. Course section linked to the course and term.
5. Faculty assignment for the section.
6. Student enrollment in the section.

Use the account's Supabase Auth UUID when assigning faculty or enrolling a student. Confirm the active faculty and student memberships exist first. The admin portal checks those roles before creating assignments and enrollments.

Then try the workflow with separate accounts and browser sessions:

1. Sign in as faculty and start attendance for the assigned section.
2. Open the Production HTTPS address on the student's phone and sign in as the student.
3. Tap **Scan attendance QR**, allow camera access, and scan the QR on the faculty screen.
4. Confirm that the faculty roster shows the student and the student's dashboard/history shows the record.
5. Close the session as faculty and verify another scan is rejected.

Use invented names, courses, and attendance. Do not use real student or faculty records in a public demonstration, README screenshot, issue, or test fixture.

## Prepare a synthetic demonstration

There are no shared demo accounts in the repository. The landing page's overview card is a design sample; its numbers are not read from the database. The `supabase/seed.sql` file contains synthetic catalog fixtures for isolated database tests; ordinary hosted `db push` does not apply that seed or create users.

For a presentation, create three Auth users using the steps above and make an invented academic catalog—for example, **Open-Source University**, department **Computing**, course **COMP-101**, term **2026 · Term 1**, and section **A**. These are examples only. You can use `Asia/Kolkata` when the institution operates on India Standard Time. Keep the demonstration in its own Supabase project and remove test users when it is no longer needed. The [demo guide](docs/demo.md) has a refresh and cleanup checklist.

## Security and known limits

- **Database-enforced access:** RLS is enabled on exposed tables. Foreign keys, unique constraints, role-scoped policies, and transactional functions enforce authorization and prevent duplicate attendance. Server checks provide immediate feedback; database policies remain the authorization boundary.
- **Secrets:** `.env.example` contains placeholders only. Local `.env*` files and Vercel project metadata are ignored by Git. Never place service-role keys, database passwords, Vercel tokens, signing secrets, or personal access tokens in the repository.
- **Role assignment:** Authentication proves which account is signed in. An active `institution_memberships` row grants its SAMS role. Profile text or client state cannot grant admin access.
- **QR privacy:** Tokens expire quickly, contain no student identity, and are not sent in the initial page request. Camera decoding stays on the device; no image, video, location, or biometric data is collected by this workflow.
- **Auditability:** Academic changes, session creation and closure, and attendance writes are recorded with limited metadata. Do not log tokens, credentials, or unnecessary personal details.
- **Account sharing and relays:** The app records attendance for the authenticated account. Software alone cannot prove who is holding the phone or prevent someone from sharing credentials or relaying a live QR. The 10-second token window makes stale screenshots less useful; it does not make attendance impossible to proxy.
- **Performance:** The QR rotation is 10 seconds and the live faculty list refreshes every two seconds while visible. Noticeable end-to-end delay has been observed in demonstrations; performance work and published latency targets remain future work. Network and database placement affect response time.
- **Institution scope:** The MVP targets one institution per installation and an English interface. The schema carries institution IDs and the institution timezone, but there is no multi-institution switcher, translated UI, gradebook, or generic plugin system yet.

Read [Security policy](SECURITY.md), [attendance limitations](docs/attendance.md), and [troubleshooting](docs/troubleshooting.md) before using the app with real records.

## Project layout

```text
app/                    Pages, layouts, role portals, and narrow API routes
components/             Shared interface and attendance components
lib/                    Auth, configuration, academic, and attendance logic
supabase/migrations/    Versioned schema, constraints, grants, and RLS policies
supabase/tests/         SQL migration and security tests
supabase/seed.sql       Synthetic catalog fixture for isolated database tests
docs/                   Setup, deployment, architecture, security, and support guides
.github/                Issue and pull request templates, plus CI workflow
```

The project intentionally uses a root-level `app/`, `components/`, and `lib/` structure. It does not add a parallel `src/` tree. Route components stay focused on presentation and call typed domain operations; PostgreSQL migrations own persistent constraints and policies.

## Contributing and quality checks

Contributions are welcome, including documentation, accessibility improvements, institution-neutral configuration, and security tests. Start with the [contribution guide](CONTRIBUTING.md), check open issues before a substantial change, and open a pull request from a short-lived branch. Bug and feature request templates are available on GitHub.

For application work, install the repository's locked dependencies with `npm ci`. A local app run is optional; it is not part of the hosted installation steps. If you run the UI locally, connect it only to a non-production Supabase project. Use the deployed HTTPS address for mobile camera scanning. See [local app development](docs/local-development.md) for the optional contributor setup.

Before opening a pull request, run the project checks from the repository root:

```sh
npm run format:check
npm run lint
npm run typecheck
npm run test
npm audit --omit=dev --audit-level=high
npm run build
```

If you run `npm run build` locally without real project configuration, copy `.env.example` to `.env.local`; its placeholder values are for checks only and must never be deployed. GitHub Actions runs the same application checks and also starts an isolated Supabase database to lint migrations and run SQL/RLS tests. Contributors do not need Docker or WSL for ordinary UI or documentation changes. Database contributors can optionally use Docker for the same isolated tests on their own machine; no hosted production credentials are used by CI.

Changes to RLS, migrations, authentication, role assignment, token signing, or personal-data handling need focused allowed-and-denied tests and careful review. Keep fixtures synthetic. Include the user impact, verification steps, accessibility impact, and any migration or environment changes in the pull request. The repository uses MIT licensing; review [third-party dependency notices](DEPENDENCIES.md) before adding packages, fonts, icons, images, or other assets. The ZXing license notice in that file needs to be preserved and checked against upstream before any vendoring or redistribution.

## Documentation, license, and support

| Guide                                                              | Contents                                                                                |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Hosted setup](docs/setup.md)                                      | Supabase migrations, user provisioning, and first academic records.                     |
| [Prerequisites](docs/prerequisites.md)                             | Supported Node.js, npm, Git, and account setup.                                         |
| [Deployment](docs/deployment.md)                                   | Supabase and Vercel configuration, production checks, and portability.                  |
| [Environment variables](docs/environment.md)                       | Every variable, its exposure, purpose, and rotation guidance.                           |
| [Architecture](docs/architecture.md)                               | Application layers, request boundaries, and replaceable services.                       |
| [Database and RLS](docs/database.md)                               | Entity model, constraints, indexes, grants, policies, and SQL tests.                    |
| [Authentication and authorization](docs/auth-and-authorization.md) | Role assignment, session behavior, and protected operations.                            |
| [Attendance](docs/attendance.md)                                   | Token lifecycle, abuse cases, defaults, and scanner behavior.                           |
| [Institution configuration](docs/configuration.md)                 | Timezones, academic structure, and policy customization.                                |
| [Demo guide](docs/demo.md)                                         | Synthetic account setup and cleanup.                                                    |
| [Troubleshooting](docs/troubleshooting.md)                         | Common migration, sign-in, camera, and attendance issues.                               |
| [Accessibility](ACCESSIBILITY.md)                                  | Current expectations and review checklist; the project does not claim WCAG conformance. |

SAMS V2 is released under the [MIT License](LICENSE). Read the [Code of Conduct](CODE_OF_CONDUCT.md) before participating. Report security issues privately using the process in [SECURITY.md](SECURITY.md); do not post exploit details, credentials, QR tokens, or student data in public issues.

<div align="center">

**Built for the people who make a campus work.**

MIT licensed · community maintained · configured by each institution

</div>
