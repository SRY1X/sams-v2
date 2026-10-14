# Installation and first administrator

This guide covers a fresh local installation and trusted administrator bootstrap. For installing Node, npm, Git, Docker, WSL, Supabase CLI, or Vercel tooling, start with [the prerequisites guide](prerequisites.md). For the local synthetic login accounts, see [demo data](demo.md).

## Local installation

1. Clone the repository and install pinned dependencies:

   ```sh
   git clone https://github.com/SRY1X/sams-v2.git
   cd sams-v2
   npm ci
   ```

2. Start Docker Desktop/Engine, then start the local Supabase stack:

   ```sh
   npm exec -- supabase start
   npm exec -- supabase status
   ```

   This applies the checked-in migrations and synthetic academic catalog. Local email/password authentication is enabled for existing provisioned accounts, while public sign-up remains disabled. Keep status output private because it contains local credentials.

3. Create `.env.local` and `.env.demo.local` from `.env.example`. Configure `.env.local` with the local API URL, publishable key, local QR signing secret, and `NEXT_PUBLIC_SITE_URL=http://localhost:3000`. Configure `.env.demo.local` with the same local URL and the local service-role key. See [environment configuration](environment.md) and [the synthetic demo guide](demo.md).

4. Create the demo sign-in identities and associated section assignments:

   ```sh
   npm run demo:seed
   ```

   The script checks for an HTTP loopback URL and exits before making requests if it is pointed anywhere else. The credentials are public, synthetic, and local-only. Do not copy them into a hosted project.

5. Start the web app and sign in:

   ```sh
   npm run dev
   ```

   Open `http://localhost:3000`; log in as admin, faculty, or student using the account table in [docs/demo.md](demo.md).

## Trusted initial administrator for a hosted institution

The local demo accounts must never be created in a hosted institution. For a hosted project, a trusted project owner should create the first Auth user in the intended Supabase project, then grant its institution membership in that project's SQL editor using the user's Auth UUID:

```sql
insert into public.institution_memberships (institution_id, user_id, role, status)
values ('YOUR_INSTITUTION_UUID', 'YOUR_AUTH_USER_UUID', 'admin', 'active');
```

This is a one-time owner operation. Do not build a public endpoint or UI that allows a user to assign themselves the admin role. Keep the project owner and service-role credentials private, and audit later role changes. Configure Auth redirect URLs, verified email delivery, signup policy, institution timezone, backup, and recovery before allowing real users. Follow [the deployment guide](deployment.md).

## Local reset

`supabase db reset --local` deletes and rebuilds the local database. Confirm that you are working on the local stack, not a linked project, then run:

```sh
npm exec -- supabase db reset --local
npm run demo:seed
```

The first command is destructive to local Supabase data. It is not required for ordinary development. Do not run a reset command against a hosted or production project.

## Production data boundary

Never use real student or faculty records in demo scripts, seed data, tests, sample screenshots, issue reports, or pull requests. Each institution should operate its own Supabase and hosting projects with separate credentials. Review retention, access, privacy, and incident response requirements before storing real academic data.
