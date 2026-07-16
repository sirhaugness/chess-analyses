import { Chess } from "chess.js";
import type { PlacedPiece } from "./types";
import { buildFen, defaultMeta } from "./chess-position";

export type ValidationIssue = {
  level: "error" | "warning";
  message: string;
};

export function validatePositionForAnalysis(
  pieces: PlacedPiece[],
  activeColor: "w" | "b",
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const whiteKings = pieces.filter((p) => p.type === "k" && p.color === "w");
  const blackKings = pieces.filter((p) => p.type === "k" && p.color === "b");

  if (whiteKings.length !== 1) {
    issues.push({
      level: "error",
      message: "Stillingen må ha nøyaktig én hvit konge.",
    });
  }
  if (blackKings.length !== 1) {
    issues.push({
      level: "error",
      message: "Stillingen må ha nøyaktig én svart konge.",
    });
  }

  const squares = new Set<string>();
  for (const p of pieces) {
    if (squares.has(p.square)) {
      issues.push({
        level: "error",
        message: `Flere brikker på ruten ${p.square}.`,
      });
    }
    squares.add(p.square);
  }

  const whitePawns = pieces.filter((p) => p.color === "w" && p.type === "p");
  const blackPawns = pieces.filter((p) => p.color === "b" && p.type === "p");
  if (whitePawns.length > 8) {
    issues.push({
      level: "warning",
      message: "Mer enn åtte hvite bønder.",
    });
  }
  if (blackPawns.length > 8) {
    issues.push({
      level: "warning",
      message: "Mer enn åtte svarte bønder.",
    });
  }
  for (const p of pieces) {
    if (p.type === "p") {
      const rank = parseInt(p.square[1], 10);
      if (rank === 1 || rank === 8) {
        issues.push({
          level: "warning",
          message: `Bonde på uvanlig rute ${p.square}.`,
        });
      }
    }
  }
  if (pieces.length > 32) {
    issues.push({
      level: "warning",
      message: "Uvanlig mange brikker på brettet.",
    });
  }

  if (
    whiteKings.length === 1 &&
    blackKings.length === 1 &&
    issues.filter((i) => i.level === "error").length === 0
  ) {
    const fen = buildFen(pieces, { ...defaultMeta(activeColor), activeColor });
    try {
      const chess = new Chess(fen);
      if (chess.isCheck()) {
        // both in check is rare; chess.js loads anyway
      }
    } catch {
      issues.push({
        level: "error",
        message: "Ugyldig sjakkstilling (FEN kan ikke lastes).",
      });
    }

    const wk = whiteKings[0].square;
    const bk = blackKings[0].square;
    if (areAdjacent(wk, bk)) {
      issues.push({
        level: "warning",
        message: "Kongene står ved siden av hverandre.",
      });
    }
  }

  return issues;
}

function areAdjacent(a: string, b: string): boolean {
  const af = a.charCodeAt(0) - 97;
  const ar = parseInt(a[1], 10) - 1;
  const bf = b.charCodeAt(0) - 97;
  const br = parseInt(b[1], 10) - 1;
  return Math.abs(af - bf) <= 1 && Math.abs(ar - br) <= 1;
}

export function canEnterAnalysisMode(issues: ValidationIssue[]): boolean {
  return !issues.some((i) => i.level === "error");
}
