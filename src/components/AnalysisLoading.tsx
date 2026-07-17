import { GlassCard } from "./AppShell";

const HERO_IMAGE = `${import.meta.env.BASE_URL}borhaug-open-hero.png`;

export function AnalysisLoading() {
  return (
    <GlassCard className="mx-4 mt-8 flex flex-col items-center gap-4 py-10 text-center">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-emerald-400"
        aria-hidden
      />
      <p className="text-lg font-medium text-stone-50">Interessant stilling. La oss se..</p>
      <img
        src={HERO_IMAGE}
        alt="Borhaug Open kongestatue"
        className="w-full max-w-xs rounded-xl border border-white/20 object-cover shadow-xl"
      />
    </GlassCard>
  );
}
