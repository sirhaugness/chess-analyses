import { GlassCard } from "./AppShell";

export function AnalysisLoading() {
  return (
    <GlassCard className="mx-4 mt-8 flex flex-col items-center gap-3 py-12 text-center">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-emerald-400"
        aria-hidden
      />
      <p className="text-lg font-medium text-stone-50">Leser av sjakkbrettet …</p>
      <p className="max-w-sm text-sm text-stone-300">
        Resultatet må alltid kontrolleres manuelt før du fortsetter.
      </p>
    </GlassCard>
  );
}
