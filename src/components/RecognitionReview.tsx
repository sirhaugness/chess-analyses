import { useMemo, useState } from "react";
import type { BoardRecognitionResult, BoardOrientation, PlacedPiece, PositionMeta } from "../lib/types";
import { classifyConfidence } from "../lib/chess-position";
import { imageCellToSquare } from "../lib/image-grid-mapping";
import { piecesToMapUpdate } from "../hooks/useChessAnalysis";
import { ReviewChessboard } from "./ReviewChessboard";
import { PiecePalette } from "./PiecePalette";
import { GlassAlert, GlassCard, PrimaryButton, SecondaryButton } from "./AppShell";
import {
  canEnterAnalysisMode,
  validatePositionForAnalysis,
} from "../lib/position-validation";

type Props = {
  result: BoardRecognitionResult;
  pieces: PlacedPiece[];
  orientation: BoardOrientation;
  onPiecesChange: (pieces: PlacedPiece[]) => void;
  onOrientationChange: (o: BoardOrientation) => void;
  onRestoreRecognition: () => void;
  onClearBoard: () => void;
  meta: PositionMeta;
  onMetaChange: (meta: PositionMeta) => void;
  onConfirm: () => void;
};

export function RecognitionReview({
  result,
  pieces,
  orientation,
  onPiecesChange,
  onOrientationChange,
  onRestoreRecognition,
  onClearBoard,
  meta,
  onMetaChange,
  onConfirm,
}: Props) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [palettePiece, setPalettePiece] = useState<PlacedPiece | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const ambiguousSquares = useMemo(() => {
    const set = new Set<string>();
    for (const cell of result.ambiguousCells) {
      set.add(imageCellToSquare(cell.imageRow, cell.imageColumn, orientation));
    }
    return set;
  }, [result.ambiguousCells, orientation]);

  const confidenceLabel = classifyConfidence(result.overallConfidence);
  const confidenceText =
    confidenceLabel === "high"
      ? "Høy"
      : confidenceLabel === "medium"
        ? "Middels"
        : "Lav";

  const issues = validatePositionForAnalysis(pieces, meta.activeColor);
  const canContinue = canEnterAnalysisMode(issues);

  const handleSquareClick = (square: string) => {
    if (palettePiece) {
      onPiecesChange(
        piecesToMapUpdate(pieces, square, {
          ...palettePiece,
          square,
        }),
      );
      setPalettePiece(null);
      return;
    }
    setSelectedSquare(square);
  };

  const handleDrop = (from: string, to: string) => {
    const map = new Map(pieces.map((p) => [p.square, p]));
    const moving = map.get(from);
    if (!moving) return false;
    map.delete(from);
    map.set(to, { ...moving, square: to });
    onPiecesChange([...map.values()].sort((a, b) => a.square.localeCompare(b.square)));
    return true;
  };

  const rotateBoard = () => {
    onOrientationChange(
      orientation === "white_at_bottom" ? "black_at_bottom" : "white_at_bottom",
    );
  };

  return (
    <GlassCard className="mx-4 mt-4 flex flex-col gap-4 pb-28">
      <header>
        <h2 className="text-xl font-semibold text-stone-50">Kontroller stillingen</h2>
        <p className="mt-1 text-sm text-amber-100">
          Rett eventuelle feil før du fortsetter til analysen.
        </p>
      </header>

      <div className="rounded-xl border border-white/15 bg-black/25 p-3 text-sm text-stone-100 backdrop-blur-sm">
        <p>
          Sikkerhet: <strong>{confidenceText}</strong> ({Math.round(result.overallConfidence * 100)} %)
        </p>
        <p>Gjenkjente brikker: {pieces.length}</p>
        {result.warnings.map((w) => (
          <p key={w} className="text-stone-300">
            {w}
          </p>
        ))}
      </div>

      <SecondaryButton className="!w-auto !min-h-10 self-start px-4" onClick={rotateBoard}>
        Roter brettet
      </SecondaryButton>

      <ReviewChessboard
        pieces={pieces}
        orientation={orientation}
        ambiguousSquares={ambiguousSquares}
        selectedSquare={selectedSquare}
        onSquareClick={handleSquareClick}
        onPieceDrop={handleDrop}
      />

      <PiecePalette
        selected={palettePiece}
        onSelect={(p) => setPalettePiece({ ...p, square: "" })}
        onClearSelection={() => setPalettePiece(null)}
      />

      <div className="flex flex-wrap gap-2">
        <SecondaryButton className="!w-auto !min-h-10 px-3 py-2 text-sm" onClick={onRestoreRecognition}>
          Gjenopprett gjenkjenning
        </SecondaryButton>
        <SecondaryButton
          className="!w-auto !min-h-10 px-3 py-2 text-sm"
          onClick={() => {
            if (selectedSquare) {
              onPiecesChange(piecesToMapUpdate(pieces, selectedSquare, null));
            }
          }}
        >
          Fjern brikke på valgt rute
        </SecondaryButton>
        <SecondaryButton className="!w-auto !min-h-10 px-3 py-2 text-sm" onClick={onClearBoard}>
          Tøm brettet
        </SecondaryButton>
      </div>

      <button
        type="button"
        className="text-left text-sm font-medium text-stone-300"
        onClick={() => setAdvancedOpen((v) => !v)}
      >
        Avanserte stillingsvalg {advancedOpen ? "▲" : "▼"}
      </button>
      {advancedOpen && (
        <div className="grid grid-cols-2 gap-2 text-sm text-stone-200">
          {(
            [
              ["whiteKingSide", "Hvit kan rokere kort"],
              ["whiteQueenSide", "Hvit kan rokere langt"],
              ["blackKingSide", "Svart kan rokere kort"],
              ["blackQueenSide", "Svart kan rokere langt"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={meta.castling[key]}
                onChange={(e) =>
                  onMetaChange({
                    ...meta,
                    castling: { ...meta.castling, [key]: e.target.checked },
                  })
                }
              />
              {label}
            </label>
          ))}
        </div>
      )}

      {issues.map((i) => (
        <GlassAlert key={i.message} tone={i.level === "error" ? "red" : "amber"}>
          {i.message}
        </GlassAlert>
      ))}

      <PrimaryButton disabled={!canContinue} onClick={onConfirm}>
        Start analyse
      </PrimaryButton>
    </GlassCard>
  );
}
