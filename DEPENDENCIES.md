# Third-party packages, assets, and services

Direct package versions are pinned through `package.json` and `package-lock.json`. Review each package’s current license and transitive dependencies before release or upgrade; include required notices when redistributing.

| Package or service                       | Purpose                                           | License / terms                                                                                                         |
| ---------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Next.js                                  | App Router framework and server runtime           | MIT                                                                                                                     |
| React / React DOM                        | UI runtime                                        | MIT                                                                                                                     |
| `@supabase/ssr`, `@supabase/supabase-js` | Cookie-aware Auth and PostgreSQL client           | MIT                                                                                                                     |
| Tailwind CSS / `@tailwindcss/postcss`    | Utility styling/build integration                 | MIT                                                                                                                     |
| Zod                                      | Runtime input validation                          | MIT                                                                                                                     |
| `qrcode.react`                           | SVG QR rendering                                  | MIT                                                                                                                     |
| TypeScript                               | Type checker/compiler                             | Apache-2.0                                                                                                              |
| ESLint / `eslint-config-next`            | Static checks                                     | MIT                                                                                                                     |
| Prettier                                 | Formatting                                        | MIT                                                                                                                     |
| Vitest                                   | Unit test runner                                  | MIT                                                                                                                     |
| Supabase                                 | Optional hosted/local Auth and PostgreSQL service | Review the applicable service terms for each deployment; the core SQL uses PostgreSQL and is stored in this repository. |
| Vercel                                   | Initial hosting option                            | Review provider terms; application code does not require Vercel-specific business APIs.                                 |

The UI uses custom inline SVG icons and system fonts; no proprietary font, stock image, third-party icon asset, analytics pixel, or external design asset is bundled. Supabase Auth/email and PostgreSQL are the configured runtime integrations. Do not add an API, font, icon, image, or package without recording its origin and redistribution terms.
