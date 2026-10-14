# SAMS V2

SAMS V2 is an open-source academic management web application for students, faculty, and institutional administrators. The MVP provides role-scoped dashboards, configurable course structure, and QR-based attendance with database-enforced eligibility and duplicate prevention.

## MVP capabilities

- Invite-only account provisioning and role-based access.
- Student dashboard and private attendance history.
- Faculty section assignments, rotating attendance QR, live session creation and closure.
- Admin tools for departments, terms, courses, sections, memberships, assignments, and enrollments.
- PostgreSQL constraints, audit events, and Row Level Security policies.

The QR workflow verifies a signed short-lived token, the signed-in student, active enrollment, and an open session. A rotating QR cannot prove a person is physically present or prevent live relay. See [attendance design](docs/attendance.md).

## Quick start

1. Install Node.js 22.22.2 or newer in the 22.x line, 24.15.0 or newer in the 24.x line, or 26.0.0 or newer, plus Docker. The Supabase CLI is installed with the project dependencies.
2. Install packages and start the local Supabase stack:

   ```sh
   npm ci
   npm exec -- supabase start
   ```

3. Copy `.env.example` to `.env.local`; fill in local Supabase URL and publishable key from `npm exec -- supabase status`. Generate an attendance secret with `openssl rand -base64 48`. Use only local development keys.
4. Create one local Auth user in Supabase Studio, then follow [the admin bootstrap steps](docs/setup.md) to grant that account the first institution admin role.
5. Start the application:

   ```sh
   npm run dev
   ```

See the [setup guide](docs/setup.md) and [local development guide](docs/local-development.md) for details, including invitations and test data.

## Project quality checks

```sh
npm run format:check
npm run lint
npm run typecheck
npm run test
npm exec -- supabase test db
npm exec -- supabase db lint --local
npm run build
```

## Project documentation

- [Architecture](docs/architecture.md)
- [Database and RLS](docs/database.md)
- [Authentication and authorization](docs/auth-and-authorization.md)
- [Environment configuration](docs/environment.md)
- [Institution customization](docs/configuration.md)
- [Deployment](docs/deployment.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Contributing](CONTRIBUTING.md)
- [Security reporting](SECURITY.md)
- [Third-party dependency licenses](DEPENDENCIES.md)

## License

SAMS V2 is distributed under the [MIT License](LICENSE). Third-party packages and assets retain their own licenses; see [DEPENDENCIES.md](DEPENDENCIES.md).
