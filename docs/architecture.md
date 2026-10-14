# Architecture overview

```text
Browser
  ├─ Next.js App Router pages and client interactions
  └─ Cookie-based Supabase Auth session
       ↓ verified server request
Next.js server layer (Server Components, Actions, Route Handlers)
  ├─ Role-scoped queries through the user's Supabase JWT
  ├─ HMAC QR issue/validation (signing secret stays server-side)
  └─ Admin invitation adapter (service key isolated and optional)
       ↓ Row Level Security + narrow transaction functions
Supabase Auth and PostgreSQL
  ├─ Auth users / profiles / memberships
  ├─ Academic structure / enrollment
  └─ Attendance sessions / records / audit events
```

The PostgreSQL schema is the source of truth for roles, institution ownership, enrollment, and attendance uniqueness. Supabase is the initial authentication and database adapter; the domain rules are expressed in typed TypeScript and PostgreSQL rather than hidden in the UI. A future backend can replace Supabase client calls while preserving PostgreSQL data shape and transaction rules.

`lib/supabase/` contains request clients; `lib/auth/` verifies identity and membership; `lib/academic/` handles academic setup; `lib/attendance/` validates signed QR claims and calls the transactional database operations; `components/` owns shared and interactive UI; `app/` maps routes to role portals and APIs. SQL in `supabase/migrations/` owns integrity, policies, audit triggers, and atomic attendance operations.

The app intentionally has no analytics, external image service, remote font, payment provider, or proprietary UI framework. The only external runtime services are the configured Auth and PostgreSQL instances. Vercel and Supabase are the initial deployment choices, not requirements in the domain model.
