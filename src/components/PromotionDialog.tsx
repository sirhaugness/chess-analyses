type Props = {
  onQueen: () => void;
  onRook: () => void;
  onBishop: () => void;
  onKnight: () => void;
};

export function PromotionDialog({ onQueen, onRook, onBishop, onKnight }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-lg">
        <p className="mb-3 text-center font-medium">Velg bondeforvandling</p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="min-h-12 rounded-xl bg-emerald-700 text-white" onClick={onQueen}>
            Dronning
          </button>
          <button type="button" className="min-h-12 rounded-xl border border-stone-300" onClick={onRook}>
            Tårn
          </button>
          <button type="button" className="min-h-12 rounded-xl border border-stone-300" onClick={onBishop}>
            Løper
          </button>
          <button type="button" className="min-h-12 rounded-xl border border-stone-300" onClick={onKnight}>
            Springer
          </button>
        </div>
      </div>
    </div>
  );
}
