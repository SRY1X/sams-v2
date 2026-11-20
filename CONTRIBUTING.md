# Contributing to SAMS V2

Contributions from students, educators, maintainers, and first-time open-source contributors are welcome. Start with an issue for substantial changes; small fixes can be proposed directly as a pull request.

## First contribution

1. Read [prerequisites](docs/prerequisites.md), [hosted setup](docs/setup.md), [architecture](docs/architecture.md), and the relevant feature documentation.
2. Create a short-lived branch such as `feat/section-enrollment` or `fix/qr-expiry-copy`.
3. Keep the change focused. Do not include real student/faculty data, credentials, institutional exports, or proprietary/unlicensed assets.
4. Add or update documentation and tests for behavior changes. RLS/schema changes need both allowed and denied access cases.
5. Run the app checks before requesting review:

   ```sh
   npm run format:check
   npm run lint
   npm run typecheck
   npm run test
   npm run build
   ```

   GitHub Actions also runs database lint and RLS tests in its isolated CI database. Contributors changing SQL may optionally reproduce those tests with a disposable local Supabase stack. Do not apply development migrations to a production institution.

6. Open a pull request using the template. Explain user impact, verification, database/auth/security impact, and any migration or configuration changes.

## Hosted development data

If you need to exercise a complete role workflow, use an isolated Supabase sandbox. Create distinct Auth users manually, assign their roles through `institution_memberships`, and use synthetic academic records. Follow [the hosted demonstration guide](docs/demo.md). Never share test passwords, service-role credentials, or Supabase project credentials in issues, screenshots, or documentation.

## Conventions

- Prefer clear names, typed interfaces, accessible controls, and small modules over clever abstractions.
- Keep domain logic out of UI components. Validate all user-controlled inputs at server boundaries.
- Treat Server Actions and Route Handlers as public endpoints. Enforce authorization in application code and RLS/database functions.
- Use additive migrations; never rewrite a shared migration after it has been applied. Never use service-role credentials for ordinary user operations.
- Avoid adding dependencies for functionality already provided by the platform or current packages. Document dependency purpose and license.
- Keep dates, academic labels, and policy values institution-aware.
- Follow [the accessibility commitment](ACCESSIBILITY.md) and describe accessibility impact in UI pull requests.
- Use conventional commit prefixes (`feat:`, `fix:`, `docs:`, `security:`, `chore:`) as a helpful convention, not a contribution gate.

## Review expectations

Changes to authentication, RLS, role assignment, signing keys, attendance validation, or personal data require careful maintainer review. Reviewers should check migration safety, allowed and denied access cases, test coverage, accessibility, and whether docs and `.env.example` need updates. Maintainers should explain requested changes and help new contributors make progress.
