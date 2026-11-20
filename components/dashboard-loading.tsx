/** Shared streamed fallback for role panels while personalized data loads. */
export function DashboardLoading({ label }: { label: string }) {
  return (
    <main className="shell py-9 sm:py-12" aria-busy="true">
      <p className="eyebrow" role="status">
        Loading {label}…
      </p>
      <div
        aria-hidden="true"
        className="mt-5 h-9 w-64 animate-pulse rounded-lg bg-[#242424] motion-reduce:animate-none"
      />
      <div
        aria-hidden="true"
        className="mt-3 h-4 w-full max-w-lg animate-pulse rounded bg-[#242424] motion-reduce:animate-none"
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            aria-hidden="true"
            className="surface h-28 animate-pulse motion-reduce:animate-none"
            key={item}
          />
        ))}
      </div>
      <div
        aria-hidden="true"
        className="surface mt-7 h-72 animate-pulse motion-reduce:animate-none"
      />
    </main>
  );
}
