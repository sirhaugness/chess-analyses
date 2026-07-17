import { useCallback, useMemo, useState } from "react";
import type { Chess, Square } from "chess.js";
import type { BoardRecognitionResult, BoardOrientation, PlacedPiece } from "../lib/types";
import {
  apiPieceToPlaced,
  buildFen,
  piecesToPlacementMap,
  placementMapToArray,
  tryCreateChess,
  tryLoadChess,
} from "../lib/chess-position";
import { orientationFromGuess } from "../lib/image-grid-mapping";

type VerboseMove = { from: string; to: string; promotion?: string };

export function useChessAnalysis(initialBoardOrientation: BoardOrientation) {
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">(
    initialBoardOrientation === "white_at_bottom" ? "white" : "black",
  );
  const [chess, setChess] = useState<Chess | null>(null);
  const [startFen, setStartFen] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [moveStack, setMoveStack] = useState<VerboseMove[]>([]);
  const [redoStack, setRedoStack] = useState<VerboseMove[]>([]);
  const [promotionPending, setPromotionPending] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [fenHistory, setFenHistory] = useState<string[]>([]);
  const [, bump] = useState(0);
  const refresh = () => bump((n) => n + 1);

  const loadNewStart = useCallback(
    (fen: string, orient: BoardOrientation): string | null => {
      setLoadError(null);

      if (chess) {
        const loaded = tryLoadChess(chess, fen);
        if (!loaded.ok) {
          setLoadError(loaded.message);
          return loaded.message;
        }
      } else {
        const created = tryCreateChess(fen);
        if (!created.ok) {
          setLoadError(created.message);
          return created.message;
        }
        setChess(created.chess);
      }

      setStartFen(fen);
      setMoveStack([]);
      setRedoStack([]);
      setFenHistory([]);
      setPromotionPending(null);
      setBoardOrientation(orient === "white_at_bottom" ? "white" : "black");
      refresh();
      return null;
    },
    [chess],
  );

  const resetToStart = useCallback(() => {
    if (!chess || !startFen) return;
    const loaded = tryLoadChess(chess, startFen);
    if (!loaded.ok) {
      setLoadError(loaded.message);
      return;
    }
    setMoveStack([]);
    setRedoStack([]);
    setPromotionPending(null);
    setLoadError(null);
    refresh();
  }, [chess, startFen]);

  const applyMove = useCallback(
    (from: string, to: string, promotion?: "q" | "r" | "b" | "n") => {
      if (!chess) return false;
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
      if (!chess) return false;
      const piece = chess.get(from as Square);
      if (!piece) return false;

      const before = chess.fen();
      chess.remove(from as Square);
      if (chess.get(to as Square)) {
        chess.remove(to as Square);
      }
      const placed = chess.put(piece, to as Square);
      if (!placed) return false;

      setFenHistory((history) => [...history, before]);
      setMoveStack((m) => [...m, { from, to }]);
      setRedoStack([]);
      setPromotionPending(null);
      refresh();
      return true;
    },
    [chess],
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
    if (!chess || fenHistory.length === 0) return;
    const previous = fenHistory[fenHistory.length - 1];
    chess.load(previous);
    setFenHistory((history) => history.slice(0, -1));
    setMoveStack((m) => m.slice(0, -1));
    setRedoStack([]);
    setPromotionPending(null);
    setLoadError(null);
    refresh();
  }, [chess, fenHistory]);

  const redo = useCallback(() => {
    if (!chess) return;
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

  const fen = chess?.fen() ?? "";
  const moveList = useMemo(() => {
    if (!startFen) return [];
    const created = tryCreateChess(startFen);
    if (!created.ok) return [];
    const c = created.chess;
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

  let statusText = "";
  if (chess) {
    if (chess.isCheckmate()) statusText = "Sjakkmatt";
    else if (chess.isStalemate()) statusText = "Patt";
    else if (chess.isDraw()) statusText = "Remis";
    else if (chess.isCheck()) statusText = "Sjakk";
    else statusText = "Utforsk stillingen";
  }

  const flipBoard = useCallback(() => {
    setBoardOrientation((o) => (o === "white" ? "black" : "white"));
  }, []);

  return {
    chess,
    isReady: chess !== null,
    loadError,
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
