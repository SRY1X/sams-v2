import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { resetPassword } from "@/lib/auth/actions";
import { getIdentity } from "@/lib/auth/session";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await getIdentity())) redirect("/login");
  const query = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <section className="surface w-full max-w-md p-8">
        <div className="mb-8 flex justify-center">
          <Brand />
        </div>
        <p className="eyebrow text-center">Account recovery</p>
        <h1 className="mt-2 text-center text-2xl font-bold">
          Choose a new password
        </h1>
        <p className="mt-2 text-center text-sm text-[#a1a1a1]">
          Use at least 12 characters. You’ll sign in again after updating it.
        </p>
        {query.error && (
          <div className="error-box mt-5" role="alert">
            {query.error === "invalid"
              ? "Passwords must match and be at least 12 characters."
              : "The password could not be updated. Request a fresh recovery link and try again."}
          </div>
        )}
        <form action={resetPassword} className="mt-7 space-y-4">
          <div>
            <label className="label" htmlFor="password">
              New password
            </label>
            <input
              className="input"
              id="password"
              name="password"
              type="password"
              minLength={12}
              maxLength={200}
              autoComplete="new-password"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="confirmation">
              Confirm password
            </label>
            <input
              className="input"
              id="confirmation"
              name="confirmation"
              type="password"
              minLength={12}
              maxLength={200}
              autoComplete="new-password"
              required
            />
          </div>
          <button className="button w-full !min-h-12" type="submit">
            Update password <span aria-hidden="true">→</span>
          </button>
        </form>
      </section>
    </main>
  );
}
