# Optional local app development

The recommended contributor flow runs the Next.js app locally but connects it to a **separate, non-production hosted Supabase sandbox**. There is no need to run a local PostgreSQL/Auth stack for routine UI or application work. Never point a local checkout or preview deployment at an institution's production database.

## Start the app

1. Install Node.js and npm, clone the repository, and run `npm ci` as described in [prerequisites](prerequisites.md).
2. Copy the safe template to the ignored local environment file:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   On macOS or Linux, use `cp .env.example .env.local`.

3. In `.env.local`, set the URL and publishable key from your own non-production Supabase project. Generate a separate `ATTENDANCE_TOKEN_SECRET` and set `NEXT_PUBLIC_SITE_URL=http://localhost:3000`. Do not paste service-role keys, passwords, or Vercel OIDC tokens into public files or screenshots. See [environment configuration](environment.md).
4. Start the Next.js app:

   ```sh
   npm run dev
   ```

   Open `http://localhost:3000` on the same computer. Mobile camera checks should use the HTTPS Vercel Preview deployment described in [deployment](deployment.md), with a separate staging Supabase project.

## Working with database changes

Use a new timestamped migration for every schema, grant, function, or RLS change. Never edit a migration that has already been applied to a shared project. Review a remote migration plan before applying it:

```sh
npm exec -- supabase login
npm exec -- supabase link --project-ref YOUR_NONPRODUCTION_PROJECT_REF
npm exec -- supabase db push --dry-run --linked
```

Apply a migration to a shared hosted project only after it has been reviewed and tested. For isolated SQL/RLS testing, a database contributor may optionally use Supabase CLI with Docker on their own machine. The CLI's local database tests are also run in GitHub Actions; contributors making ordinary app or documentation changes do not need Docker, WSL, or local Supabase.

## Quality checks

```sh
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

Database schema and RLS changes should include both allowed and denied cases in `supabase/tests/`. Never use real student/faculty data in fixtures, local app development, logs, or screenshots.

## Development conventions

- Prefer Server Components and server-side Supabase access; use client components for browser interactions such as QR refresh or camera scanning.
- Verify identity server-side and enforce permissions again in RLS or database functions.
- Treat every Server Action and Route Handler like a public API endpoint.
- Validate inputs at server boundaries. Never trust client-provided role, user ID, institution scope, or ownership.
- Keep secrets, institution data, and generated build output out of Git.
