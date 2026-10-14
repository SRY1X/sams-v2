# Hosted setup and first users

This is the recommended beginner path: use a dedicated hosted Supabase project for your institution, create Auth users manually, deploy the web app through Vercel, and configure courses and sections through the admin portal. Docker, WSL, and a local Supabase server are not required. See [prerequisites](prerequisites.md) and the [deployment guide](deployment.md) for environment details.

## 1. Create a Supabase project

Create a new Supabase project for this SAMS instance. Choose a region close to its users and save the database password in a password manager. Do not use the public SAMS project or another institution's database.

## 2. Apply the database schema

From a trusted computer with Git, Node.js, and npm:

```sh
git clone https://github.com/SRY1X/sams-v2.git
cd sams-v2
npm ci
npm exec -- supabase login
npm exec -- supabase link --project-ref YOUR_PROJECT_REF
npm exec -- supabase db push --dry-run --linked
npm exec -- supabase db push --linked
```

Confirm the project reference shown in the Supabase dashboard before applying the migrations. The dry run must show only migrations you intend to apply. `db push` applies versioned migrations; it does not create demo users or the academic catalog.

The initial migration creates a placeholder institution with ID `00000000-0000-4000-8000-000000000001` and its settings. In **Supabase → SQL Editor**, change that institution's name, slug, and timezone before assigning users:

```sql
update public.institutions
set name = 'Your Institution',
    slug = 'your-institution',
    timezone = 'Asia/Kolkata'
where id = '00000000-0000-4000-8000-000000000001';
```

Use an IANA timezone appropriate to the institution. A fresh migration has no courses, departments, sections, enrollments, or attendance records. The admin portal is used to create the academic structure.

## 3. Disable public sign-up and create Auth accounts manually

In Supabase Auth settings, disable public user sign-up before sharing the app. In **Supabase → Authentication → Users → Add user**, create at least one separate user for each role you want to use: admin, faculty, and student. Set distinct passwords and confirm the accounts. Use test mailboxes/aliases you control for a demonstration; never publish passwords or use real student data in public examples.

Copy each account UUID from the Auth users list. In **SQL Editor**, insert its institution membership. Replace the placeholder UUIDs with actual UUIDs from your project:

```sql
insert into public.institution_memberships
  (institution_id, user_id, role, status)
values
  ('00000000-0000-4000-8000-000000000001', 'ADMIN-AUTH-USER-UUID',   'admin',   'active'),
  ('00000000-0000-4000-8000-000000000001', 'FACULTY-AUTH-USER-UUID', 'faculty', 'active'),
  ('00000000-0000-4000-8000-000000000001', 'STUDENT-AUTH-USER-UUID', 'student', 'active')
on conflict (institution_id, user_id)
do update set role = excluded.role, status = 'active';
```

Confirm the accounts have their intended active roles:

```sql
select m.role, m.status, p.display_name, u.email
from public.institution_memberships as m
join auth.users as u on u.id = m.user_id
join public.profiles as p on p.id = m.user_id
where m.institution_id = '00000000-0000-4000-8000-000000000001'
order by m.role;
```

The profile record is created automatically when each Auth user is created. If a display name was not included in Auth metadata, set it in the trusted SQL editor as needed:

```sql
update public.profiles
set display_name = 'Demo Administrator'
where id = 'ADMIN-AUTH-USER-UUID';
```

One user can have one role per institution. Creating an Auth account alone does not grant portal access; the membership is the role assignment. Keep the first admin bootstrap in a trusted owner's hands, and never add a public self-promotion flow.

## 4. Deploy through Vercel

Import the repository into Vercel. Configure the required values under **Project → Settings → Environment Variables**:

| Variable                               | Where to get it                                       |
| -------------------------------------- | ----------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase → Project Settings → API                     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API → Publishable key   |
| `ATTENDANCE_TOKEN_SECRET`              | Generate a unique random value with the command below |
| `NEXT_PUBLIC_SITE_URL`                 | The exact HTTPS URL assigned to the Vercel deployment |

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Use separate Supabase projects and signing secrets for Preview/staging and Production. A Supabase service-role key is not needed when accounts are created manually. It is optional for the app's invitation feature, and must remain server-only if configured.

In **Supabase → Authentication → URL Configuration**, set the Site URL to the Vercel URL and add `https://YOUR-VERCEL-DOMAIN/auth/callback` to the redirect URL allow list. Keep public sign-up disabled and restrict redirects to domains you control. Review [environment configuration](environment.md) and [deployment](deployment.md).

## 5. Configure the academic structure

1. Sign in with the admin account.
2. Create a department and academic term.
3. Create courses and course sections.
4. Assign the faculty user's Auth UUID to a section.
5. Enroll the student's Auth UUID in that section.

Then sign in as faculty to create an attendance session. Open the deployed HTTPS site on a student's phone, sign in to the student account, and scan the faculty QR. The student can see their own attendance history; faculty can see records for assigned sections.

## Demo safety

There are no shared demo passwords, public test accounts, or scripts that create accounts in a hosted project. For a public walkthrough, maintain an isolated synthetic Supabase project and provision its users yourself. Do not use institution production credentials, student exports, or real attendance history in screenshots, issues, sample data, or public docs.
