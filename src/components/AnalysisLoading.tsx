import { GlassCard } from "./AppShell";

const LOADING_KING = `${import.meta.env.BASE_URL}loading-king.svg`;

export function AnalysisLoading() {
  return (
    <GlassCard className="mx-4 mt-8 flex flex-col items-center gap-4 py-12 text-center">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-emerald-400"
        aria-hidden
      />
      <p className="text-lg font-medium text-stone-50">Interessant stilling. La oss se..</p>
      <img
        src={LOADING_KING}
        alt=""
        aria-hidden
        className="h-28 w-28 opacity-90 drop-shadow-lg"
      />
    </GlassCard>
  );
}
