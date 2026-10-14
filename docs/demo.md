# Local demonstration data

SAMS V2 includes a synthetic local dataset so students, faculty, administrators, and contributors can explore the application without access to a real institution's data.

## What is included

The local seed creates an institution called **Open-Source University** in the `Asia/Kolkata` time zone, a computing department, the 2026–27 academic year, a course, and section A. The demo-user script creates one administrator, one faculty member, and one student; assigns the faculty member to the section; enrolls the student; and adds one closed sample session with one historical present record.

All names and email addresses are synthetic. The `.example.test` domain is reserved for testing and cannot receive normal public email.

## Create or refresh local demo accounts

1. Start the local Supabase stack with `npm exec -- supabase start`.
2. Copy `.env.example` to `.env.demo.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` using the **local** values shown by `npm exec -- supabase status`.
3. Set the same local URL and publishable key in `.env.local` for the web application.
4. Run:

   ```sh
   npm run demo:seed
   ```

The script refuses any URL other than HTTP loopback (`localhost`, `127.0.0.1`, or `::1`). It uses the local service-role key only for this synthetic fixture. It is idempotent and resets the three demo passwords to the documented local password each time it runs.

| Role    | Local email                    | Local-only password      |
| ------- | ------------------------------ | ------------------------ |
| Admin   | `admin@sams-v2.example.test`   | `SamsDemo!LocalOnly2026` |
| Faculty | `faculty@sams-v2.example.test` | `SamsDemo!LocalOnly2026` |
| Student | `student@sams-v2.example.test` | `SamsDemo!LocalOnly2026` |

These credentials are intentionally public and synthetic. **Never seed these accounts into a hosted or production project.** The script's loopback guard is an additional safety check, not a reason to reuse its password or service key in a hosted environment. `.env.demo.local` is ignored by Git.

## Reset local data

To reset the local database (this deletes all data in the local Supabase stack), verify you are not linked to a hosted project and run:

```sh
npm exec -- supabase db reset --local
npm run demo:seed
```

Do not add real student/faculty names, emails, photographs, IDs, grades, attendance exports, or screenshots to seed files, tests, or public documentation. If an institution needs to demonstrate its configuration, replace the synthetic catalog in its own private environment and keep those records out of this public repository.
