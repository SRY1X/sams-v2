export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={`grid size-9 place-items-center rounded-lg ${inverse ? "bg-white/15 text-white" : "bg-[#262626] text-[#ff8833]"}`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
          <path d="m9 9 2 2 4-4" />
        </svg>
      </span>
      <span className="leading-tight">
        <span
          className={`block text-[15px] font-extrabold tracking-tight ${inverse ? "text-white" : "text-[#fafafa]"}`}
        >
          SAMS <span className="font-medium opacity-60">V2</span>
        </span>
        <span
          className={`block text-[9px] font-bold uppercase tracking-[.15em] ${inverse ? "text-white/60" : "text-[#a1a1a1]"}`}
        >
          Academic workspace
        </span>
      </span>
    </span>
  );
}
