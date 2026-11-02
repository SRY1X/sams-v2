"use client";

export default function Error({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <section className="surface w-full max-w-md p-8 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#261715] text-2xl text-[#ff9588]">
          !
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">
          Workspace temporarily unavailable
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#a1a1a1]">
          We could not load the latest workspace data. Try again in a moment.
        </p>
        <button className="button mt-6" type="button" onClick={retry}>
          Try again <span aria-hidden="true">↻</span>
        </button>
      </section>
    </main>
  );
}
