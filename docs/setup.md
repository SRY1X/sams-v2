# Installation and first administrator

## Requirements

- Node.js 22.22.2 or newer in the 22.x line, 24.15.0 or newer in the 24.x line, or 26.0.0 or newer; npm; Git; and a Docker-compatible runtime.
- Supabase CLI (installed with project dependencies) for local PostgreSQL/Auth, or a Supabase project for hosted development.
- A modern browser; student check-in is designed for a phone camera’s native QR reader.

## Local setup

1. Clone the repository, then run `npm ci`.
2. Run `npm exec -- supabase start`. The local stack applies migrations and the synthetic academic catalog seed. No user accounts or personal data are seeded.
3. Create `.env.local` from `.env.example`. Use the local API URL and publishable key shown by `npm exec -- supabase status`. Create an HMAC key with `openssl rand -base64 48`.
4. Open local Supabase Studio and create one Auth user. The auth trigger creates the corresponding profile.
5. In the local SQL editor, run the following statement using the new Auth user ID from Studio:

   ```sql
   insert into public.institution_memberships (institution_id, user_id, role, status)
   values ('00000000-0000-4000-8000-000000000001', 'REPLACE-WITH-LOCAL-USER-UUID', 'admin', 'active');
   ```

   This is a trusted-owner bootstrap step. Do not expose an equivalent self-service admin operation. For a hosted institution, run the same operation only in its intended project and under the project owner’s control.

6. To enable admin invitations locally, copy the local service-role key from `supabase status` into `.env.local`. The app uses it only after verifying the signed-in administrator in a server action.
7. Run `npm run dev`, open `http://localhost:3000`, sign in, create academic sections, invite users, then assign/enroll them.

## Hosted Supabase setup

Create a fresh project, review the migrations, and apply them through your approved migration workflow. Create the first Auth administrator in Supabase Auth and grant the initial membership with a trusted project-owner SQL session. Configure the site URL and callback allow-list, disable public sign-up, and use a verified SMTP provider before sending real invitations or password reset links. Keep the service-role and signing secrets server-only.

## Demo data

`supabase/seed.sql` adds a clearly labeled synthetic institution, department, term, course, and section. It adds no people, attendance, email addresses, or default passwords. Do not use real institutional records in seed files or screenshots.
