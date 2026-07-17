type Props = {
  onQueen: () => void;
  onRook: () => void;
  onBishop: () => void;
  onKnight: () => void;
};

export function PromotionDialog({ onQueen, onRook, onBishop, onKnight }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-stone-900/95 p-4 shadow-xl backdrop-blur-lg">
        <p className="mb-3 text-center font-medium text-stone-50">Velg bondeforvandling</p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="min-h-12 rounded-xl bg-emerald-600 text-white" onClick={onQueen}>
            Dronning
          </button>
          <button type="button" className="min-h-12 rounded-xl border border-white/25 bg-white/10 text-stone-100" onClick={onRook}>
            Tårn
          </button>
          <button type="button" className="min-h-12 rounded-xl border border-white/25 bg-white/10 text-stone-100" onClick={onBishop}>
            Løper
          </button>
          <button type="button" className="min-h-12 rounded-xl border border-white/25 bg-white/10 text-stone-100" onClick={onKnight}>
            Springer
          </button>
        </div>
      </div>
    </div>
  );
}
