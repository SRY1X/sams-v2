# Local development

The root-level `app/`, `components/`, and `lib/` directories are intentional; do not add a parallel `src/` tree. App Router pages should stay thin, reusable UI belongs in `components/`, and domain behavior belongs in `lib/` or database functions/migrations.

## Daily workflow

1. Start Docker and run `npm exec -- supabase start` for the local Auth and PostgreSQL stack.
2. Start the web app with `npm run dev`.
3. After changing SQL, add a new timestamped migration and run `npm exec -- supabase db reset` locally. Never edit an already-applied shared migration; create a follow-up migration.
4. Validate with formatting, lint, type check, unit tests, database tests, and production build before opening a pull request.
5. Use synthetic accounts/data only. Local email messages can be inspected in the local Supabase email testing inbox; they are not sent to real users.

## Database and test commands

```sh
npm exec -- supabase status
npm exec -- supabase db reset
npm exec -- supabase test db
npm exec -- supabase db lint --local
```

The CLI manages the local stack and requires a Docker-compatible runtime. Do not link a local project to production for routine development. See [Supabase local development](https://supabase.com/docs/guides/local-development) for installation and platform-specific details.

## Development conventions

- Prefer Server Components and server-side Supabase access; add client components only for browser interaction such as QR refresh.
- Verify auth with `getClaims()` in server contexts. Treat every Server Action and Route Handler as an API endpoint and authorize it independently.
- Validate inputs at server boundaries. Do not trust hidden form fields for user ID, role, institution scope, or ownership.
- Add schema, index, and RLS changes together. Keep secrets, institution data, and generated build output out of Git.
