import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { getPublicEnv } from "@/lib/config/env";
import { getMembership } from "@/lib/auth/session";
import { getConfiguredInstitutionId } from "@/lib/config/server-env";

export default async function Home() {
  const membership = await getMembership();
  if (membership) redirect("/dashboard");
  const configured = Boolean(
    getPublicEnv().supabaseUrl &&
    getPublicEnv().supabasePublishableKey &&
    getConfiguredInstitutionId(),
  );
  return (
    <main className="min-h-screen overflow-hidden bg-[#121212]">
      <header className="shell flex h-[84px] items-center justify-between">
        <Brand />
        <Link className="button secondary !min-h-10" href="/login">
          Sign in <span aria-hidden="true">↗</span>
        </Link>
      </header>
      <section className="shell grid min-h-[670px] items-center gap-12 py-16 lg:grid-cols-[1.04fr_.96fr] lg:py-20">
        <div className="relative z-10">
          <div className="eyebrow mb-6 flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#3ecf8e]" /> Open academic
            infrastructure
          </div>
          <h1 className="max-w-[690px] text-[clamp(3rem,6vw,3.75rem)] font-medium leading-none tracking-[-.04em] text-[#fafafa]">
            A clearer way to run a{" "}
            <span className="text-[#3ecf8e]">campus.</span>
          </h1>
          <p className="mt-7 max-w-[560px] text-[17px] leading-7 text-[#b4b4b4]">
            SAMS brings course operations and secure QR attendance into one
            thoughtful workspace for students, faculty, and academic
            administrators.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link className="button !min-h-12 !px-5" href="/login">
              Open your workspace <span aria-hidden="true">→</span>
            </Link>
            <span className="text-xs font-semibold text-[#b4b4b4]">
              MIT licensed · community built
            </span>
          </div>
          {!configured && (
            <div className="notice-box mt-7 max-w-lg" role="status">
              <span>
                <strong>Workspace setup is pending.</strong>A site administrator
                needs to connect Supabase and configure this institution before
                accounts can sign in.
              </span>
            </div>
          )}
          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-[11px] font-semibold text-[#b4b4b4]">
            <span>01 &nbsp; Role-aware by design</span>
            <span>02 &nbsp; Database-enforced privacy</span>
            <span>03 &nbsp; Open source</span>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[510px]">
          <div className="lattice-art" aria-hidden="true" />
          <div className="surface relative overflow-hidden p-5 sm:p-7">
            <div className="flex items-center justify-between border-b border-[#2e2e2e] pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#898989]">
                  Sample workspace preview
                </p>
                <h2 className="mt-1 text-[17px] font-bold">
                  Academic overview
                </h2>
              </div>
              <span className="badge">Synthetic data</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#242424] p-4">
                <span className="text-[10px] font-bold text-[#b4b4b4]">
                  ATTENDANCE RATE
                </span>
                <div className="mt-2 flex items-end gap-2">
                  <b className="text-3xl tracking-tight">92.4%</b>
                  <span className="mb-1 text-[10px] font-bold text-[#3ecf8e]">
                    +2.1%
                  </span>
                </div>
                <div className="mt-4 h-1.5 rounded-full bg-[#2e2e2e]">
                  <div className="h-full w-[92%] rounded-full bg-[#3ecf8e]" />
                </div>
              </div>
              <div className="rounded-xl bg-[#242424] p-4">
                <span className="text-[10px] font-bold text-[#b4b4b4]">
                  THIS WEEK
                </span>
                <div className="mt-2 text-3xl font-bold tracking-tight">
                  18{" "}
                  <span className="text-sm font-medium text-[#b4b4b4]">
                    sessions
                  </span>
                </div>
                <p className="mt-4 text-[10px] text-[#b4b4b4]">
                  Across 6 active sections
                </p>
              </div>
            </div>
            <div className="mt-5 rounded-xl border border-[#2e2e2e] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-bold">Recent activity</span>
                <span className="text-[10px] text-[#b4b4b4]">See all</span>
              </div>
              {[
                [
                  "CS",
                  "Computer Science · Section A",
                  "Present",
                  "#102b1e",
                  "#3ecf8e",
                ],
                [
                  "MA",
                  "Applied Mathematics · Section B",
                  "Present",
                  "#102b1e",
                  "#3ecf8e",
                ],
                [
                  "PH",
                  "Physics Lab · Section A",
                  "On time",
                  "#242424",
                  "#b4b4b4",
                ],
              ].map(([initials, title, status, bg, color]) => (
                <div
                  key={title}
                  className="flex items-center gap-3 border-t border-[#2e2e2e] py-3 first:border-0"
                >
                  <span className="grid size-9 place-items-center rounded-lg bg-[#242424] text-[10px] font-extrabold text-[#3ecf8e]">
                    {initials}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11px] font-semibold">
                    {title}
                  </span>
                  <span
                    className="rounded-full px-2 py-1 text-[9px] font-bold"
                    style={{ background: bg, color }}
                  >
                    {status}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#102b1e] p-4">
              <span className="grid size-10 place-items-center rounded-lg bg-[#242424] text-[#3ecf8e]">
                ◉
              </span>
              <span className="flex-1">
                <b className="block text-[11px]">Attendance is ready</b>
                <span className="mt-1 block text-[10px] text-[#b4b4b4]">
                  Scan a live QR code to check in securely.
                </span>
              </span>
              <span className="text-[#3ecf8e]">→</span>
            </div>
          </div>
          <div className="surface absolute -bottom-8 -left-9 hidden items-center gap-3 p-3 sm:flex">
            <span className="grid size-9 place-items-center rounded-full bg-[#242424] text-sm text-[#3ecf8e]">
              ✓
            </span>
            <span>
              <b className="block text-[11px]">Secure by default</b>
              <span className="text-[9px] text-[#b4b4b4]">
                Your records stay yours
              </span>
            </span>
          </div>
        </div>
      </section>
      <section className="border-y border-[#2e2e2e] bg-[#242424] py-7">
        <div className="shell flex flex-wrap items-center justify-between gap-4">
          <p className="text-[11px] font-bold uppercase tracking-[.11em] text-[#898989]">
            Built for the people who make a campus work
          </p>
          <div className="flex gap-7 text-[12px] font-semibold text-[#b4b4b4]">
            <span>Students</span>
            <span>Faculty</span>
            <span>Administrators</span>
            <span>Contributors</span>
          </div>
        </div>
      </section>
      <footer className="shell flex flex-wrap justify-between gap-4 py-8 text-[10px] text-[#b4b4b4]">
        <span>© SAMS V2 · Community maintained</span>
        <span>
          Secure attendance · Open standards · Institution configurable
        </span>
      </footer>
    </main>
  );
}
