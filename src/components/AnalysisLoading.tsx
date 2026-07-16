export function AnalysisLoading() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-emerald-700"
        aria-hidden
      />
      <p className="text-lg font-medium text-stone-800">Leser av sjakkbrettet …</p>
      <p className="max-w-sm text-sm text-stone-600">
        Resultatet må alltid kontrolleres manuelt før du fortsetter.
      </p>
    </div>
  );
}
