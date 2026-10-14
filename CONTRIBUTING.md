# Contributing to SAMS V2

Contributions from students, educators, maintainers, and first-time open-source contributors are welcome. Start with an issue or discussion for substantial changes; small fixes can be proposed directly as a pull request.

## First contribution

1. Read [the prerequisites](docs/prerequisites.md), [setup guide](docs/setup.md), [architecture](docs/architecture.md), and the relevant feature documentation.
2. Create a branch such as `feat/section-enrollment` or `fix/qr-expiry-copy`.
3. Keep changes focused. Do not include real student/faculty data, credentials, institutional exports, or proprietary/unlicensed assets.
4. Add or update documentation and tests for behavior changes. RLS/schema changes need success and denial cases.
5. Run `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm audit --omit=dev --audit-level=high`, `npm exec -- supabase db lint --local`, `npm exec -- supabase test db`, and `npm run build`.
6. Open a pull request using the template. Explain user impact, verification, database/auth/security impact, and any migration or configuration changes.

First-time contributors can run a synthetic admin, faculty, and student workflow locally by following [the demo setup](docs/demo.md). The published demo credentials are only safe on a loopback Supabase stack. Never copy them to a hosted project.

## Conventions

- Prefer clear names, typed interfaces, accessible controls, and small modules over clever abstractions.
- Keep domain logic out of UI components. Validate all user-controlled inputs at server boundaries.
- Treat Server Actions and Route Handlers like public endpoints. Enforce authorization both in application code and RLS/transaction functions.
- Use additive migrations; never rewrite a shared migration after it has been applied. Never use service-role credentials for ordinary user operations.
- Avoid adding dependencies for functionality already provided by the platform or current packages. Document dependency purpose and license.
- Keep dates, academic labels, and policy values institution-aware.
- Follow [the accessibility commitment](ACCESSIBILITY.md) and describe accessibility impact in UI pull requests.
- Use conventional commit prefixes (`feat:`, `fix:`, `docs:`, `security:`, `chore:`) as a helpful convention, not a contribution gate.

## Review expectations

Changes to authentication, RLS, role assignment, signing keys, attendance validation, or personal data require careful maintainer review. Reviewers should check migration safety, allowed and denied access cases, test coverage, accessibility, and whether docs and `.env.example` need updates. Maintainers should explain requested changes and help new contributors make progress.
