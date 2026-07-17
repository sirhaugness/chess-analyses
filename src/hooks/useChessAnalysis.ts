import { useCallback, useState } from "react";
import type { BoardRecognitionResult, BoardOrientation, PlacedPiece } from "../lib/types";
import {
  apiPieceToPlaced,
  buildFen,
  defaultMeta,
  fenToPieces,
  piecesToPlacementMap,
  placementMapToArray,
} from "../lib/chess-position";
import { orientationFromGuess } from "../lib/image-grid-mapping";

type MoveRecord = { from: string; to: string; label: string };

export function useChessAnalysis(initialBoardOrientation: BoardOrientation) {
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">(
    initialBoardOrientation === "white_at_bottom" ? "white" : "black",
  );
  const [pieces, setPieces] = useState<PlacedPiece[]>([]);
  const [startPieces, setStartPieces] = useState<PlacedPiece[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [moveStack, setMoveStack] = useState<MoveRecord[]>([]);
  const [redoMoveStack, setRedoMoveStack] = useState<MoveRecord[]>([]);
  const [pieceHistory, setPieceHistory] = useState<PlacedPiece[][]>([]);
  const [pieceRedo, setPieceRedo] = useState<PlacedPiece[][]>([]);
  const [positionLoaded, setPositionLoaded] = useState(false);

  const loadNewStartFromPieces = useCallback(
    (nextPieces: PlacedPiece[], orient: BoardOrientation): string | null => {
      setLoadError(null);
      setStartPieces(nextPieces);
      setPieces(nextPieces);
      setMoveStack([]);
      setRedoMoveStack([]);
      setPieceHistory([]);
      setPieceRedo([]);
      setBoardOrientation(orient === "white_at_bottom" ? "white" : "black");
      setPositionLoaded(true);
      return null;
    },
    [],
  );

  const loadNewStart = useCallback(
    (fen: string, orient: BoardOrientation): string | null => {
      setLoadError(null);
      try {
        const parsed = fenToPieces(fen);
        return loadNewStartFromPieces(parsed, orient);
      } catch {
        const message = "Ugyldig sjakkstilling (FEN kan ikke lastes).";
        setLoadError(message);
        return message;
      }
    },
    [loadNewStartFromPieces],
  );

  const resetToStart = useCallback(() => {
    setPieces(startPieces);
    setMoveStack([]);
    setRedoMoveStack([]);
    setPieceHistory([]);
    setPieceRedo([]);
    setLoadError(null);
  }, [startPieces]);

  const tryMove = useCallback(
    (from: string, to: string): boolean => {
      if (from === to) return false;
      const map = piecesToPlacementMap(pieces);
      const moving = map.get(from);
      if (!moving) return false;

      map.delete(from);
      map.set(to, { ...moving, square: to });
      const next = placementMapToArray(map);

      setPieceHistory((history) => [...history, pieces]);
      setPieceRedo([]);
      setPieces(next);
      setMoveStack((m) => [...m, { from, to, label: `${from} → ${to}` }]);
      setRedoMoveStack([]);
      return true;
    },
    [pieces],
  );

  const undo = useCallback(() => {
    if (pieceHistory.length === 0 || moveStack.length === 0) return;
    const previous = pieceHistory[pieceHistory.length - 1];
    const lastMove = moveStack[moveStack.length - 1];
    setPieceRedo((redo) => [...redo, pieces]);
    setRedoMoveStack((redo) => [...redo, lastMove]);
    setPieces(previous);
    setPieceHistory((history) => history.slice(0, -1));
    setMoveStack((m) => m.slice(0, -1));
    setLoadError(null);
  }, [pieceHistory, moveStack, pieces]);

  const redo = useCallback(() => {
    if (pieceRedo.length === 0 || redoMoveStack.length === 0) return;
    const nextPieces = pieceRedo[pieceRedo.length - 1];
    const nextMove = redoMoveStack[redoMoveStack.length - 1];
    setPieceHistory((history) => [...history, pieces]);
    setPieces(nextPieces);
    setPieceRedo((redo) => redo.slice(0, -1));
    setMoveStack((m) => [...m, nextMove]);
    setRedoMoveStack((r) => r.slice(0, -1));
  }, [pieceRedo, redoMoveStack, pieces]);

  const fen = buildFen(pieces, defaultMeta("w"));
  const moveList = moveStack.map((m) => m.label);
  const statusText = "Utforsk stillingen";

  const flipBoard = useCallback(() => {
    setBoardOrientation((o) => (o === "white" ? "black" : "white"));
  }, []);

  return {
    chess: null,
    isReady: positionLoaded,
    loadError,
    fen,
    moveList,
    boardOrientation,
    promotionPending: null,
    statusText,
    tryMove,
    completePromotion: () => {},
    undo,
    redo,
    resetToStart,
    loadNewStart,
    loadNewStartFromPieces,
    flipBoard,
    canUndo: pieceHistory.length > 0,
    canRedo: pieceRedo.length > 0,
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
