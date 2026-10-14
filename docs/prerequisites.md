# Prerequisites

Choose the hosted setup unless you are actively changing the application. Docker Desktop, WSL, and a local Supabase stack are not required to deploy SAMS or to develop the Next.js app against an isolated hosted sandbox.

## For an institution deployment

You need:

- A GitHub account to access the source repository
- A Supabase account and a new project for your SAMS instance
- A Vercel account to deploy the web application
- A password manager for database passwords and signing keys

Follow [hosted setup](setup.md). You can use the Supabase and Vercel dashboards for most steps. To apply versioned SQL migrations from the repository, install Git and a supported Node.js version with npm as described below; the Supabase CLI is pinned in this project and invoked with `npm exec`.

## For contributors running the app

Install Git and Node.js from their official sources:

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/en/download) — SAMS supports Node.js 22.22.2+ in the 22.x line, 24.15.0+ in the 24.x line, or 26.0.0+. npm is bundled with Node.js.

Verify in a new terminal:

```sh
git --version
node --version
npm --version
```

On Windows, PowerShell or Git Bash is sufficient. WSL is optional; if you use it, keep the checkout and the Node/npm/Git installations in one environment instead of mixing Windows and WSL toolchains.

Clone the project and install the lockfile-pinned dependencies:

```sh
git clone https://github.com/SRY1X/sams-v2.git
cd sams-v2
npm ci
```

For app work, configure `.env.local` with a **non-production hosted Supabase project** and follow [local app development](local-development.md). The team can use GitHub Actions to validate pull requests. Contributors changing SQL can optionally use Docker-compatible local Supabase for isolated database tests; see [contributing](../CONTRIBUTING.md). Docker is not a prerequisite for ordinary UI, documentation, or hosted deployment work.

## Vercel CLI (optional)

The Vercel dashboard can import the GitHub repository and deploy it without a local CLI. If you choose to use the CLI, install it using Vercel's official instructions. Never put a Vercel token in the repository, `.env.example`, a public issue, or a screenshot.
