import Link from "next/link";
import { signOut } from "@/lib/auth/actions";
import { Brand } from "@/components/brand";

export default function AccessPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <div className="surface w-full max-w-md p-8 text-center">
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <Brand />
          </Link>
        </div>
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#142019] text-2xl text-[#ff8833]">
          ⌁
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">
          Access is being set up
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#a1a1a1]">
          Your account is signed in, but it is not linked to an active
          institution role yet. Ask your academic administrator to add your
          account.
        </p>
        <form action={signOut} className="mt-7">
          <button className="button secondary" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
