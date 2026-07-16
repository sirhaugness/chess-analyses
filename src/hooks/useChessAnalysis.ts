import { useCallback, useMemo, useState } from "react";
import { Chess, type Square } from "chess.js";
import type { BoardRecognitionResult, BoardOrientation, PlacedPiece } from "../lib/types";
import {
  apiPieceToPlaced,
  buildFen,
  piecesToPlacementMap,
  placementMapToArray,
} from "../lib/chess-position";
import { orientationFromGuess } from "../lib/image-grid-mapping";

type VerboseMove = { from: string; to: string; promotion?: string };

export function useChessAnalysis(
  analysisStartFen: string,
  initialBoardOrientation: BoardOrientation,
) {
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">(
    initialBoardOrientation === "white_at_bottom" ? "white" : "black",
  );
  const [startFen, setStartFen] = useState(analysisStartFen);

  const [chess] = useState(() => new Chess(analysisStartFen));
  const [moveStack, setMoveStack] = useState<VerboseMove[]>([]);
  const [redoStack, setRedoStack] = useState<VerboseMove[]>([]);
  const [promotionPending, setPromotionPending] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [, bump] = useState(0);
  const refresh = () => bump((n) => n + 1);

  const resetToStart = useCallback(() => {
    chess.load(startFen);
    setMoveStack([]);
    setRedoStack([]);
    setPromotionPending(null);
    refresh();
  }, [chess, startFen]);

  const loadNewStart = useCallback(
    (fen: string, orient: BoardOrientation) => {
      chess.load(fen);
      setStartFen(fen);
      setMoveStack([]);
      setRedoStack([]);
      setPromotionPending(null);
      setBoardOrientation(orient === "white_at_bottom" ? "white" : "black");
      refresh();
    },
    [chess],
  );

  const applyMove = useCallback(
    (from: string, to: string, promotion?: "q" | "r" | "b" | "n") => {
      const move = chess.move({ from, to, promotion });
      if (!move) return false;
      setMoveStack((m) => [...m, { from, to, promotion }]);
      setRedoStack([]);
      refresh();
      return true;
    },
    [chess],
  );

  const tryMove = useCallback(
    (from: string, to: string): boolean => {
      const piece = chess.get(from as Square);
      if (!piece) return false;
      if (piece.type === "p") {
        const rank = to[1];
        if ((piece.color === "w" && rank === "8") || (piece.color === "b" && rank === "1")) {
          setPromotionPending({ from, to });
          return false;
        }
      }
      return applyMove(from, to);
    },
    [chess, applyMove],
  );

  const completePromotion = useCallback(
    (piece: "q" | "r" | "b" | "n") => {
      if (!promotionPending) return;
      applyMove(promotionPending.from, promotionPending.to, piece);
      setPromotionPending(null);
    },
    [promotionPending, applyMove],
  );

  const undo = useCallback(() => {
    const undone = chess.undo();
    if (!undone) return;
    setMoveStack((m) => {
      const last = m[m.length - 1];
      if (!last) return m;
      setRedoStack((r) => [...r, last]);
      return m.slice(0, -1);
    });
    refresh();
  }, [chess]);

  const redo = useCallback(() => {
    setRedoStack((r) => {
      if (r.length === 0) return r;
      const next = r[r.length - 1];
      const ok = chess.move({
        from: next.from,
        to: next.to,
        promotion: next.promotion as "q" | "r" | "b" | "n" | undefined,
      });
      if (!ok) return r;
      setMoveStack((m) => [...m, next]);
      refresh();
      return r.slice(0, -1);
    });
  }, [chess]);

  const fen = chess.fen();
  const moveList = useMemo(() => {
    const c = new Chess(startFen);
    const sans: string[] = [];
    for (const m of moveStack) {
      const played = c.move({
        from: m.from,
        to: m.to,
        promotion: m.promotion as "q" | "r" | "b" | "n" | undefined,
      });
      if (played) sans.push(played.san);
    }
    return sans;
  }, [moveStack, startFen]);

  const statusText = useMemo(() => {
    if (chess.isCheckmate()) return "Sjakkmatt";
    if (chess.isStalemate()) return "Patt";
    if (chess.isDraw()) return "Remis";
    if (chess.isCheck()) return "Sjakk";
    return chess.turn() === "w" ? "Hvit i trekket" : "Svart i trekket";
  }, [chess, fen]);

  const flipBoard = useCallback(() => {
    setBoardOrientation((o) => (o === "white" ? "black" : "white"));
  }, []);

  return {
    chess,
    fen,
    moveList,
    boardOrientation,
    promotionPending,
    statusText,
    tryMove,
    completePromotion,
    undo,
    redo,
    resetToStart,
    loadNewStart,
    flipBoard,
    canUndo: moveStack.length > 0,
    canRedo: redoStack.length > 0,
  };
}

export function recognitionToPieces(
  result: BoardRecognitionResult,
  orientation: BoardOrientation,
): PlacedPiece[] {
  return result.pieces.map((p) => apiPieceToPlaced(p, orientation));
}

export function guessToOrientation(
  guess: BoardRecognitionResult["orientationGuess"],
  override?: BoardOrientation,
): BoardOrientation {
  return orientationFromGuess(guess, override);
}

export function piecesFromRecognition(
  raw: BoardRecognitionResult,
  orientation: BoardOrientation,
): PlacedPiece[] {
  return recognitionToPieces(raw, orientation);
}

export function piecesToMapUpdate(
  pieces: PlacedPiece[],
  square: string,
  next: PlacedPiece | null,
): PlacedPiece[] {
  const map = piecesToPlacementMap(pieces);
  if (next) map.set(square, next);
  else map.delete(square);
  return placementMapToArray(map);
}

export function buildAnalysisFen(
  pieces: PlacedPiece[],
  meta: import("../lib/types").PositionMeta,
): string {
  return buildFen(pieces, meta);
}
