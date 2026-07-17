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
import { GlassAlert, GlassCard, PrimaryButton, SecondaryButton } from "./AppShell";

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
    <GlassCard className="mx-4 mt-4 flex flex-col gap-4 pb-28">
      <h2 className="text-xl font-semibold text-stone-50">Fri redigering</h2>
      <p className="text-sm text-stone-300">
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
        <SecondaryButton className="!w-auto !min-h-10 px-3 py-2 text-sm" onClick={() => editor.undo()} disabled={!editor.canUndo}>
          Angre
        </SecondaryButton>
        <SecondaryButton className="!w-auto !min-h-10 px-3 py-2 text-sm" onClick={() => editor.redo()} disabled={!editor.canRedo}>
          Gjør om
        </SecondaryButton>
        <SecondaryButton className="!w-auto !min-h-10 px-3 py-2 text-sm" onClick={() => editor.clearBoard()}>
          Tøm brettet
        </SecondaryButton>
        <SecondaryButton className="!w-auto !min-h-10 px-3 py-2 text-sm" onClick={() => editor.resetTo(photoPieces)}>
          Gjenopprett bildestilling
        </SecondaryButton>
      </div>

      {issues.map((i) => (
        <GlassAlert key={i.message} tone={i.level === "error" ? "red" : "amber"}>
          {i.message}
        </GlassAlert>
      ))}

      <div className="flex flex-col gap-2">
        <PrimaryButton
          disabled={!canEnterAnalysisMode(issues)}
          onClick={() => onSaveAsAnalysisStart(editor.pieces)}
        >
          Lagre som analyseutgangspunkt
        </PrimaryButton>
        <SecondaryButton onClick={onCancel}>Avbryt uten å lagre</SecondaryButton>
        <button type="button" className="min-h-11 text-sm text-stone-300 underline" onClick={onRestorePhoto}>
          Tilbake til bildestilling
        </button>
      </div>
    </GlassCard>
  );
}
