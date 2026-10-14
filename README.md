# SAMS V2

SAMS V2 is an open-source academic management web application for students, faculty, and institutional administrators. The MVP brings role-scoped academic portals and QR-based attendance together in one installable application.

> **Project status:** MVP in active development. Review the security, privacy, retention, backup, and institution policy requirements before using real academic records. The local seed contains synthetic academic structure only; it does not create demo users or passwords.

## What the MVP includes

- Student, faculty, and administrator roles with database-enforced access control.
- Institution-configurable departments, terms, courses, sections, faculty assignments, and enrollments.
- Faculty-created attendance sessions with short-lived rotating QR codes.
- Student check-in validated against authentication, enrollment, session state, and database constraints.
- Student attendance history, faculty session records, and institution-scoped administration.
- PostgreSQL migrations, Row Level Security policies, audit events, and synthetic local seed data.

The rotating QR limits reuse of old screenshots but cannot prove physical presence or prevent someone relaying a live code. Read [the attendance design](docs/attendance.md) before adopting the workflow. Face recognition, location tracking, grading, messaging, and other larger features are intentionally outside the MVP.

## Run SAMS locally — step by step

### 1. Install the prerequisites

- Git
- Node.js **22.22.2+ in the 22.x line**, **24.15.0+ in the 24.x line**, or **26.0.0+**; npm is included with Node.js
- Docker Desktop (Windows/macOS) or another Docker-compatible runtime, running before you start Supabase
- A modern browser

The Supabase CLI is a project dependency, so you do not need to install it globally.

### 2. Clone the repository and install dependencies

```sh
git clone https://github.com/SRY1X/sams-v2.git
cd sams-v2
npm ci
```

### 3. Start the local Supabase services

Start Docker Desktop, then run:

```sh
npm exec -- supabase start
npm exec -- supabase status
```

The local stack applies the checked-in migrations and `supabase/seed.sql`. The status output includes local URLs and keys. Use only the local API URL and publishable key when filling in the next step. **Do not paste the full status output into an issue, pull request, screenshot, or chat:** it also contains local secret keys.

### 4. Create your local environment file

In Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

On macOS or Linux:

```sh
cp .env.example .env.local
```

Open `.env.local` and set the local Supabase URL and publishable key reported by `supabase status`. The default local URL is usually `http://127.0.0.1:54321`. Generate a local-only QR signing secret with Node.js:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Set the generated value as `ATTENDANCE_TOKEN_SECRET` and set `NEXT_PUBLIC_SITE_URL=http://localhost:3000`. Keep `.env.local` private; it is ignored by Git. For variable descriptions and optional configuration, see [Environment configuration](docs/environment.md).

`SUPABASE_SERVICE_ROLE_KEY` is optional and only needed to try the administrator invitation flow locally. If you enable it, use the **local** service key from the local Supabase status output. It bypasses RLS and must never be sent to a browser, committed, or copied from production.

### 5. Create the first local administrator

1. Open local Supabase Studio, usually at `http://127.0.0.1:54323`.
2. Go to **Authentication → Users** and add a synthetic local user. Copy that user's UUID from the user list.
3. Open the Studio SQL Editor and run the following query, replacing the UUID placeholder with the local user ID:

   ```sql
   insert into public.institution_memberships (institution_id, user_id, role, status)
   values (
     '00000000-0000-4000-8000-000000000001',
     'REPLACE-WITH-LOCAL-USER-UUID',
     'admin',
     'active'
   );
   ```

This is a trusted local bootstrap operation. It is not an application endpoint and must not be used to let users grant themselves roles. Production setup has additional requirements; follow [the installation and first-administrator guide](docs/setup.md).

### 6. Start the web app

```sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the local administrator account. Use the admin portal to create a department, an academic term whose dates include today, a course, and a course section. Invite or create synthetic faculty and student accounts, then assign the faculty member and enroll the student in that section. Local invitation and recovery emails are captured by Supabase's local email testing inbox; the local Supabase status output shows its URL.

### 7. Try the attendance workflow

1. Sign in as the faculty account and open its assigned section.
2. Start an attendance session and display the rotating QR code.
3. Sign in as the enrolled student on another device or browser and open **Scan QR**.
4. Allow camera access, scan the currently displayed QR, and confirm the check-in.
5. Return to the faculty session to confirm the student appears once. The student can also review their own attendance history.

**Camera note:** Browsers require a secure context for camera access. `http://localhost` is treated as secure on the same computer, but a phone opening an `http://192.168.x.x` LAN address cannot use the browser camera. For phone testing, use an HTTPS preview connected to a separate staging Supabase project with synthetic data. Do not point a public preview at production student records. See [deployment guidance](docs/deployment.md).

### 8. Run the project checks

```sh
npm run format:check
npm run lint
npm run typecheck
npm run test
npm audit --omit=dev --audit-level=high
npm exec -- supabase db lint --local
npm exec -- supabase test db
npm run build
```

Database checks require the local Supabase stack to be running. Pull requests run the automated checks in GitHub Actions.

## Deploy your own instance

Use your own Supabase project and Vercel project. Create separate staging and production Supabase projects, apply reviewed migrations to the intended project, configure Auth redirects and email delivery, and put environment variables in the hosting provider's environment settings. Never use this project's test accounts or another institution's data. Follow the [deployment guide](docs/deployment.md) and [environment variable reference](docs/environment.md).

## Documentation

- [Architecture overview](docs/architecture.md)
- [Database schema and RLS](docs/database.md)
- [Authentication and authorization](docs/auth-and-authorization.md)
- [Attendance lifecycle and limitations](docs/attendance.md)
- [Local installation and admin bootstrap](docs/setup.md)
- [Local development conventions](docs/local-development.md)
- [Institution configuration](docs/configuration.md)
- [Vercel and Supabase deployment](docs/deployment.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Contributing](CONTRIBUTING.md)
- [Code of conduct](CODE_OF_CONDUCT.md)
- [Security reporting](SECURITY.md)
- [Third-party package and asset licenses](DEPENDENCIES.md)

## Contributing

Issues and focused pull requests are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md), use synthetic data, and include tests for changes to authorization, database rules, and attendance behavior. Please do not post credentials, QR tokens, or real student/faculty data in public issues. The `private` field in `package.json` only prevents accidental npm package publication; GitHub repository visibility is configured separately.

## License

SAMS V2 is distributed under the [MIT License](LICENSE). Third-party packages and services retain their own terms; see [DEPENDENCIES.md](DEPENDENCIES.md) and the upstream notices for each package.
