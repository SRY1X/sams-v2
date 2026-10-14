# Environment configuration

For local app development, copy `.env.example` to `.env.local`. For Vercel, configure variables in the Vercel project's encrypted environment settings. Never commit `.env.local`, print secret values in logs, or share environment screenshots. Use separate Supabase projects and signing keys for staging/Preview and Production.

| Variable                               | Required    | Exposure           | Purpose                                                                                                                                                                                          |
| -------------------------------------- | ----------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes         | Browser and server | Supabase project URL. Public connection metadata; authorization must come from Auth and RLS.                                                                                                     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes         | Browser and server | Supabase publishable key. It does not grant permission to read or change data without valid policy.                                                                                              |
| `ATTENDANCE_TOKEN_SECRET`              | Yes         | Server only        | HMAC signing key for short-lived QR tokens. Use at least 32 random bytes and a different value in every environment.                                                                             |
| `NEXT_PUBLIC_SITE_URL`                 | Recommended | Browser and server | Canonical site origin for invitation and recovery callback URLs. Match Supabase Auth URL settings exactly.                                                                                       |
| `SUPABASE_SERVICE_ROLE_KEY`            | Optional    | Server only        | Only needed for the admin invitation feature. It bypasses RLS: never expose it to the client, use it for routine user operations, or commit it. Manual account provisioning does not require it. |

Generate a QR signing secret with Node.js:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

The public setup uses hosted Supabase. If you run the app locally, connect only to a dedicated non-production sandbox and keep `.env.local` out of Git. Do not add Vercel OIDC tokens, database passwords, personal access tokens, or service-role keys to `.env.example`. A Supabase publishable key is intended to be public; secret keys are not.
