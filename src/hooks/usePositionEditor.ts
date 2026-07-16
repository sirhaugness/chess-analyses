import { useCallback, useState } from "react";
import type { PlacedPiece } from "../lib/types";
import {
  piecesToPlacementMap,
  placementMapToArray,
} from "../lib/chess-position";

export type EditorOp =
  | { type: "set"; square: string; piece: PlacedPiece | null }
  | { type: "clear" };

type Snapshot = PlacedPiece[];

export function usePositionEditor(initial: PlacedPiece[]) {
  const [pieces, setPieces] = useState<PlacedPiece[]>(initial);
  const [past, setPast] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);

  const pushHistory = useCallback((current: PlacedPiece[]) => {
    setPast((p) => [...p, current]);
    setFuture([]);
  }, []);

  const setPieceAt = useCallback(
    (square: string, piece: PlacedPiece | null) => {
      setPieces((current) => {
        pushHistory(current);
        const map = piecesToPlacementMap(current);
        if (piece) map.set(square, { ...piece, square });
        else map.delete(square);
        return placementMapToArray(map);
      });
    },
    [pushHistory],
  );

  const clearBoard = useCallback(() => {
    setPieces((current) => {
      pushHistory(current);
      return [];
    });
  }, [pushHistory]);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const prev = p[p.length - 1];
      setFuture((f) => [pieces, ...f]);
      setPieces(prev);
      return p.slice(0, -1);
    });
  }, [pieces]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setPast((p) => [...p, pieces]);
      setPieces(next);
      return f.slice(1);
    });
  }, [pieces]);

  const resetTo = useCallback((snapshot: PlacedPiece[]) => {
    setPieces(snapshot);
    setPast([]);
    setFuture([]);
  }, []);

  const cancelTo = useCallback((snapshot: PlacedPiece[]) => {
    resetTo(snapshot);
  }, [resetTo]);

  const movePiece = useCallback((from: string, to: string) => {
    setPieces((current) => {
      const moving = current.find((p) => p.square === from);
      if (!moving) return current;
      pushHistory(current);
      const map = piecesToPlacementMap(current);
      map.delete(from);
      map.set(to, { ...moving, square: to });
      return placementMapToArray(map);
    });
  }, [pushHistory]);

  return {
    pieces,
    setPieces,
    setPieceAt,
    movePiece,
    clearBoard,
    undo,
    redo,
    resetTo,
    cancelTo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
