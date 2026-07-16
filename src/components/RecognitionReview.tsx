import { useMemo, useState } from "react";
import type { BoardRecognitionResult, BoardOrientation, PlacedPiece, PositionMeta } from "../lib/types";
import { classifyConfidence } from "../lib/chess-position";
import { imageCellToSquare } from "../lib/image-grid-mapping";
import { piecesToMapUpdate } from "../hooks/useChessAnalysis";
import { ReviewChessboard } from "./ReviewChessboard";
import { PiecePalette } from "./PiecePalette";
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
  onFreeEdit: () => void;
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
  onFreeEdit,
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

  return (
    <section className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6 pb-28">
      <header>
        <h2 className="text-xl font-semibold">Kontroller stillingen</h2>
        <p className="mt-1 text-sm text-amber-900">
          Vi er usikre på noen av rutene. Kontroller og rett stillingen før du fortsetter.
        </p>
      </header>

      <div className="rounded-xl bg-white p-3 text-sm shadow-sm">
        <p>
          Sikkerhet: <strong>{confidenceText}</strong> ({Math.round(result.overallConfidence * 100)} %)
        </p>
        <p>Gjenkjente brikker: {pieces.length}</p>
        {result.orientationGuess === "uncertain" && (
          <p className="text-amber-800">Orientering er usikker — velg manuelt under.</p>
        )}
        {result.warnings.map((w) => (
          <p key={w} className="text-stone-600">
            {w}
          </p>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
            orientation === "white_at_bottom" ? "border-emerald-600 bg-emerald-50" : "border-stone-300"
          }`}
          onClick={() => onOrientationChange("white_at_bottom")}
        >
          Hvite brikker nærmest meg
        </button>
        <button
          type="button"
          className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
            orientation === "black_at_bottom" ? "border-emerald-600 bg-emerald-50" : "border-stone-300"
          }`}
          onClick={() => onOrientationChange("black_at_bottom")}
        >
          Svarte brikker nærmest meg
        </button>
      </div>

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
        <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={onRestoreRecognition}>
          Gjenopprett gjenkjenning
        </button>
        <button
          type="button"
          className="rounded-lg border px-3 py-2 text-sm"
          onClick={() => {
            if (selectedSquare) {
              onPiecesChange(piecesToMapUpdate(pieces, selectedSquare, null));
            }
          }}
        >
          Fjern brikke på valgt rute
        </button>
        <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={onClearBoard}>
          Tøm brettet
        </button>
      </div>

      <div className="rounded-xl bg-white p-3 shadow-sm">
        <p className="text-sm font-medium">Hvem er i trekket?</p>
        <p className="text-xs text-stone-500">Dette kan ikke bestemmes fra bildet.</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className={`rounded-lg border px-3 py-2 text-sm ${meta.activeColor === "w" ? "border-emerald-600" : ""}`}
            onClick={() => onMetaChange({ ...meta, activeColor: "w" })}
          >
            Hvit i trekket
          </button>
          <button
            type="button"
            className={`rounded-lg border px-3 py-2 text-sm ${meta.activeColor === "b" ? "border-emerald-600" : ""}`}
            onClick={() => onMetaChange({ ...meta, activeColor: "b" })}
          >
            Svart i trekket
          </button>
        </div>
      </div>

      <button
        type="button"
        className="text-left text-sm font-medium text-stone-700"
        onClick={() => setAdvancedOpen((v) => !v)}
      >
        Avanserte stillingsvalg {advancedOpen ? "▲" : "▼"}
      </button>
      {advancedOpen && (
        <div className="grid grid-cols-2 gap-2 text-sm">
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
        <p key={i.message} className={i.level === "error" ? "text-red-700 text-sm" : "text-amber-800 text-sm"}>
          {i.message}
        </p>
      ))}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={!canContinue}
          className="min-h-12 rounded-xl bg-emerald-700 text-white font-medium disabled:opacity-50"
          onClick={onConfirm}
        >
          Start analyse
        </button>
        <button type="button" className="min-h-11 rounded-xl border border-stone-300" onClick={onFreeEdit}>
          Fri redigering (tidligere stilling)
        </button>
      </div>
    </section>
  );
}
