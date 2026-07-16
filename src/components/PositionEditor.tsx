import { useState } from "react";
import type { BoardOrientation, PlacedPiece } from "../lib/types";
import { usePositionEditor } from "../hooks/usePositionEditor";
import { ReviewChessboard } from "./ReviewChessboard";
import { PiecePalette } from "./PiecePalette";
import {
  canEnterAnalysisMode,
  validatePositionForAnalysis,
} from "../lib/position-validation";
import type { PositionMeta } from "../lib/types";

type Props = {
  initialPieces: PlacedPiece[];
  orientation: BoardOrientation;
  meta: PositionMeta;
  photoPieces: PlacedPiece[];
  onSaveAsAnalysisStart: (pieces: PlacedPiece[]) => void;
  onCancel: () => void;
  onRestorePhoto: () => void;
};

export function PositionEditor({
  initialPieces,
  orientation,
  meta,
  photoPieces,
  onSaveAsAnalysisStart,
  onCancel,
  onRestorePhoto,
}: Props) {
  const editor = usePositionEditor(initialPieces);
  const [palettePiece, setPalettePiece] = useState<PlacedPiece | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  const issues = validatePositionForAnalysis(editor.pieces, meta.activeColor);

  return (
    <section className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6 pb-28">
      <h2 className="text-xl font-semibold">Fri redigering</h2>
      <p className="text-sm text-stone-600">
        Appen kjenner ikke tidligere trekk. Du kan rekonstruere en mulig tidligere stilling manuelt.
      </p>

      <ReviewChessboard
        pieces={editor.pieces}
        orientation={orientation}
        selectedSquare={selectedSquare}
        onSquareClick={(sq) => {
          if (palettePiece) {
            editor.setPieceAt(sq, { ...palettePiece, square: sq });
            setPalettePiece(null);
            return;
          }
          setSelectedSquare(sq);
        }}
        onPieceDrop={(from, to) => {
          const moving = editor.pieces.find((p) => p.square === from);
          if (!moving) return false;
          editor.movePiece(from, to);
          return true;
        }}
      />

      <PiecePalette
        selected={palettePiece}
        onSelect={(p) => setPalettePiece({ ...p, square: "" })}
        onClearSelection={() => setPalettePiece(null)}
      />

      <div className="flex flex-wrap gap-2">
        <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => editor.undo()} disabled={!editor.canUndo}>
          Angre
        </button>
        <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => editor.redo()} disabled={!editor.canRedo}>
          Gjør om
        </button>
        <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => editor.clearBoard()}>
          Tøm brettet
        </button>
        <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => editor.resetTo(photoPieces)}>
          Gjenopprett bildestilling
        </button>
      </div>

      {issues.map((i) => (
        <p key={i.message} className={i.level === "error" ? "text-red-700 text-sm" : "text-amber-800 text-sm"}>
          {i.message}
        </p>
      ))}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={!canEnterAnalysisMode(issues)}
          className="min-h-12 rounded-xl bg-emerald-700 text-white font-medium disabled:opacity-50"
          onClick={() => onSaveAsAnalysisStart(editor.pieces)}
        >
          Lagre som analyseutgangspunkt
        </button>
        <button type="button" className="min-h-11 rounded-xl border" onClick={onCancel}>
          Avbryt uten å lagre
        </button>
        <button type="button" className="min-h-11 text-sm text-stone-600 underline" onClick={onRestorePhoto}>
          Tilbake til bildestilling
        </button>
      </div>
    </section>
  );
}
