import type { PlacedPiece } from "../lib/types";

const WHITE: Array<{ type: PlacedPiece["type"]; label: string }> = [
  { type: "k", label: "K" },
  { type: "q", label: "D" },
  { type: "r", label: "T" },
  { type: "b", label: "L" },
  { type: "n", label: "S" },
  { type: "p", label: "B" },
];

type Props = {
  selected: PlacedPiece | null;
  onSelect: (piece: PlacedPiece) => void;
  onClearSelection: () => void;
};

export function PiecePalette({ selected, onSelect, onClearSelection }: Props) {
  const renderRow = (color: "w" | "b", title: string) => (
    <div>
      <p className="mb-1 text-xs font-medium text-stone-300">{title}</p>
      <div className="flex flex-wrap gap-2">
        {WHITE.map((p) => {
          const piece: PlacedPiece = { square: "a1", color, type: p.type };
          const active =
            selected?.color === color && selected?.type === p.type && !selected.square;
          return (
            <button
              key={`${color}-${p.type}`}
              type="button"
              className={`min-h-10 min-w-10 rounded-lg border px-3 text-sm font-semibold ${
                active
                  ? "border-emerald-400 bg-emerald-950/50 text-emerald-50"
                  : "border-white/25 bg-white/10 text-stone-100"
              }`}
              onClick={() => onSelect(piece)}
            >
              {color === "w" ? p.label : p.label.toLowerCase()}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="rounded-xl border border-white/15 bg-black/25 p-3 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-stone-50">Brikkepalett</span>
        <button type="button" className="text-xs text-stone-300 underline" onClick={onClearSelection}>
          Fjern valg
        </button>
      </div>
      {renderRow("w", "Hvite")}
      <div className="mt-3">{renderRow("b", "Svarte")}</div>
    </div>
  );
}
