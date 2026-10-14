import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { signIn, requestPasswordReset } from "@/lib/auth/actions";
import { getIdentity } from "@/lib/auth/session";
import { safeInternalPath } from "@/lib/auth/safe-redirect";

/** Renders sign-in and password recovery forms, or redirects an authenticated user to the dashboard. */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identity = await getIdentity();
  if (identity) redirect("/dashboard");
  const query = await searchParams;
  const next = safeInternalPath(
    typeof query.next === "string" ? query.next : null,
  );
  const error = typeof query.error === "string" ? query.error : "";
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_.9fr]">
      <aside className="relative hidden overflow-hidden bg-[#0a0a0a] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-40 top-24 size-[560px] rounded-full border border-white/10" />
        <div className="absolute -right-20 top-44 size-[330px] rounded-full border border-white/10" />
        <Link href="/">
          <Brand inverse />
        </Link>
        <div className="relative max-w-[520px] pb-14">
          <div className="eyebrow !text-[#a1a1a1]">
            A better campus workflow
          </div>
          <h1 className="mt-6 text-5xl font-semibold leading-[1.03] tracking-[-.055em]">
            Your academic day, in one place.
          </h1>
          <p className="mt-6 max-w-md text-sm leading-6 text-white/65">
            A calmer way to manage classes, take attendance, and keep your
            academic community in sync.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-3">
            <div className="rounded-[10px] border border-white/15 bg-white/[.06] p-4">
              <b className="text-xl">01</b>
              <span className="mt-2 block text-[10px] text-white/70">
                Sign in securely
              </span>
            </div>
            <div className="rounded-[10px] border border-white/15 bg-white/[.06] p-4">
              <b className="text-xl">02</b>
              <span className="mt-2 block text-[10px] text-white/70">
                See your role-based view
              </span>
            </div>
            <div className="rounded-[10px] border border-white/15 bg-white/[.06] p-4">
              <b className="text-xl">03</b>
              <span className="mt-2 block text-[10px] text-white/70">
                Get on with your day
              </span>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-white/45">
          SAMS V2 · Open academic infrastructure
        </p>
      </aside>
      <section className="flex min-h-screen items-center justify-center px-5 py-12">
        <div className="w-full max-w-[390px]">
          <div className="mb-12 lg:hidden">
            <Link href="/">
              <Brand />
            </Link>
          </div>
          <p className="eyebrow">Welcome back</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            Sign in to SAMS
          </h2>
          <p className="mt-2 text-sm text-[#a1a1a1]">
            Use the account provided by your institution.
          </p>
          {error && (
            <div className="error-box mt-6" role="alert">
              {error === "credentials"
                ? "We couldn’t sign you in with those details. Check them and try again."
                : error === "configuration"
                  ? "Sign-in is not configured yet. Follow the deployment guide."
                  : "Enter a valid email and password."}
            </div>
          )}
          {query.reset === "sent" && (
            <div
              className="mt-6 rounded-lg border border-[#262626] bg-[#142019] p-3 text-xs text-[#7cc9a0]"
              role="status"
            >
              If the account exists, a password reset email is on its way.
            </div>
          )}
          {query.reset === "complete" && (
            <div
              className="mt-6 rounded-lg border border-[#262626] bg-[#142019] p-3 text-xs text-[#7cc9a0]"
              role="status"
            >
              Password reset complete. Sign in with your new password.
            </div>
          )}
          <form action={signIn} className="mt-8 space-y-5">
            <input type="hidden" name="next" value={next} />
            <div>
              <label className="label" htmlFor="email">
                Email address
              </label>
              <input
                className="input"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder="you@example.edu"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                className="input"
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={200}
                placeholder="Enter your password"
              />
            </div>
            <button className="button w-full !min-h-12" type="submit">
              Sign in <span aria-hidden="true">→</span>
            </button>
          </form>
          <form action={requestPasswordReset} className="mt-4 text-center">
            <details className="group text-xs text-[#ff8833]">
              <summary className="cursor-pointer list-none">
                Forgot password?
              </summary>
              <div className="mt-3 flex gap-2">
                <label className="sr-only" htmlFor="reset-email">
                  Email address
                </label>
                <input
                  className="input !min-h-10 text-xs"
                  id="reset-email"
                  name="email"
                  type="email"
                  required
                  placeholder="Your account email"
                />
                <button
                  className="button !min-h-10 !px-3 !text-xs"
                  type="submit"
                >
                  Send link
                </button>
              </div>
            </details>
          </form>
          <p className="mt-8 border-t border-[#262626] pt-6 text-center text-xs leading-5 text-[#a1a1a1]">
            Accounts are provided by your institution. Need access? Contact your
            academic administrator.
          </p>
          <Link
            href="/"
            className="mt-7 block text-center text-[11px] font-semibold text-[#a1a1a1]"
          >
            ← Back to SAMS overview
          </Link>
        </div>
      </section>
    </main>
  );
}
