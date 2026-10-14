# Development prerequisites

This guide prepares a clean development machine for SAMS V2. It covers Windows 11 with Docker Desktop and WSL 2, plus short notes for macOS and Linux. Install tools from their official sources; use the project-pinned Supabase CLI instead of a global CLI installation.

## Windows: recommended setup

### 1. Install Git for Windows

Download and install [Git for Windows](https://git-scm.com/install/windows). The default Git Bash and credential-manager options are suitable for most contributors. Open a new PowerShell terminal and verify:

```powershell
git --version
```

### 2. Install WSL 2

Open PowerShell as Administrator and run:

```powershell
wsl --install
```

Restart Windows if prompted, then open the installed Linux distribution and create its Linux username. Check the WSL version with:

```powershell
wsl --status
wsl --list --verbose
```

Use WSL 2. Keep a project either in the Linux filesystem (for example `~/projects/sams-v2`) or in Windows (for example `C:\Users\you\Documents\sams-v2`). Avoid switching between Windows and Linux Node/npm installations in the same checkout. Choose one terminal and use its matching Git, Node, and npm consistently.

### 3. Install Docker Desktop

Install [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/), enable the WSL 2 backend, and start Docker Desktop before starting the local Supabase stack. Check that Docker is available:

```powershell
docker version
```

If the command reports that it cannot connect to the daemon, open Docker Desktop, wait for it to finish starting, and check again. Do not install a second Docker daemon inside WSL for this project unless you intentionally configure a separate runtime.

### 4. Install Node.js and npm

Install a supported Node.js release from [nodejs.org](https://nodejs.org/en/download). SAMS supports Node.js 22.22.2+ in the 22.x line, 24.15.0+ in the 24.x line, or 26.0.0+. npm is bundled with Node.js; there is no need to reinstall npm globally.

Close and reopen PowerShell or your WSL terminal after installation so PATH changes take effect. Verify:

```powershell
node --version
npm --version
where.exe node
where.exe npm
```

In WSL, use `command -v node` and `command -v npm` instead of `where.exe`. If a command is missing, see [npm's PATH troubleshooting guide](https://docs.npmjs.com/try-the-latest-stable-version-of-npm#updating-your-version-of-npm-and-node-js) and make sure the correct Node installation is on PATH.

### 5. Supabase CLI and Vercel CLI

The Supabase CLI is pinned in `package-lock.json` and invoked using npm:

```powershell
npm exec -- supabase --version
```

This keeps contributors on the same CLI version without global installation. Local Supabase uses Docker to run PostgreSQL, Auth, Studio, and local API services.

The Vercel CLI is optional. You can import the GitHub repository in the Vercel dashboard, or use `npm exec -- vercel` after installing the CLI as a development tool or using Vercel's documented CLI setup. Never put a Vercel token in the repository or a public issue.

## macOS and Linux

Install Git, a supported Node.js release with npm, and Docker Engine/Desktop from their official sources. Start the Docker daemon before `npm exec -- supabase start`. On Linux, ensure your user can access Docker without weakening the machine's security configuration. Run all commands in one environment (host or a development container) and avoid mixing package-manager installations.

## Final check

From the SAMS V2 repository root, these should all return successfully before local setup:

```sh
git --version
node --version
npm --version
docker version
npm exec -- supabase --version
```

See [the setup guide](setup.md) for the next steps.
