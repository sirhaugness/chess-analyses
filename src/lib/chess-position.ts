import { Chess } from "chess.js";
import type { BoardOrientation, CastlingRights, PlacedPiece, PositionMeta } from "./types";
import type { PieceType, RecognizedPiece } from "./types";
import { imageCellToSquare } from "./image-grid-mapping";

const PIECE_TYPE_MAP: Record<PieceType, PlacedPiece["type"]> = {
  king: "k",
  queen: "q",
  rook: "r",
  bishop: "b",
  knight: "n",
  pawn: "p",
};

export function apiPieceToPlaced(
  piece: RecognizedPiece,
  orientation: BoardOrientation,
): PlacedPiece {
  return {
    square: imageCellToSquare(piece.imageRow, piece.imageColumn, orientation),
    color: piece.color === "white" ? "w" : "b",
    type: PIECE_TYPE_MAP[piece.type],
  };
}

export function piecesToPlacementMap(
  pieces: PlacedPiece[],
): Map<string, PlacedPiece> {
  const map = new Map<string, PlacedPiece>();
  for (const p of pieces) {
    map.set(p.square, p);
  }
  return map;
}

export function placementMapToArray(map: Map<string, PlacedPiece>): PlacedPiece[] {
  return [...map.values()].sort((a, b) => a.square.localeCompare(b.square));
}

export function buildPiecePlacement(pieces: PlacedPiece[]): string {
  const bySquare = new Map(pieces.map((p) => [p.square, p]));
  const rows: string[] = [];
  for (let rank = 8; rank >= 1; rank--) {
    let row = "";
    let empty = 0;
    for (let file = 0; file < 8; file++) {
      const sq = `${String.fromCharCode(97 + file)}${rank}`;
      const piece = bySquare.get(sq);
      if (!piece) {
        empty++;
      } else {
        if (empty > 0) {
          row += String(empty);
          empty = 0;
        }
        const ch = piece.type;
        row += piece.color === "w" ? ch.toUpperCase() : ch;
      }
    }
    if (empty > 0) row += String(empty);
    rows.push(row);
  }
  return rows.join("/");
}

export function buildFen(
  pieces: PlacedPiece[],
  meta: PositionMeta,
  halfmove = 0,
  fullmove = 1,
): string {
  const placement = buildPiecePlacement(pieces);
  const castling = castlingToFen(meta.castling);
  return `${placement} ${meta.activeColor} ${castling} - ${halfmove} ${fullmove}`;
}

export function castlingToFen(c: CastlingRights): string {
  let s = "";
  if (c.whiteKingSide) s += "K";
  if (c.whiteQueenSide) s += "Q";
  if (c.blackKingSide) s += "k";
  if (c.blackQueenSide) s += "q";
  return s || "-";
}

export function defaultCastling(): CastlingRights {
  return {
    whiteKingSide: false,
    whiteQueenSide: false,
    blackKingSide: false,
    blackQueenSide: false,
  };
}

export function defaultMeta(activeColor: "w" | "b" = "w"): PositionMeta {
  return { activeColor, castling: defaultCastling() };
}

export function fenToPieces(fen: string): PlacedPiece[] {
  const part = fen.split(" ")[0];
  const pieces: PlacedPiece[] = [];
  const rows = part.split("/");
  for (let r = 0; r < rows.length; r++) {
    const rank = 8 - r;
    let file = 0;
    for (const ch of rows[r]) {
      if (ch >= "1" && ch <= "8") {
        file += parseInt(ch, 10);
      } else {
        const sq = `${String.fromCharCode(97 + file)}${rank}`;
        const lower = ch.toLowerCase();
        pieces.push({
          square: sq,
          color: ch === lower ? "b" : "w",
          type: lower as PlacedPiece["type"],
        });
        file++;
      }
    }
  }
  return pieces;
}

export function isValidSquareName(sq: string): boolean {
  if (sq.length !== 2) return false;
  const f = sq.charCodeAt(0);
  const r = parseInt(sq[1], 10);
  return f >= 97 && f <= 104 && r >= 1 && r <= 8;
}

export function classifyConfidence(value: number): "high" | "medium" | "low" {
  if (value >= 0.85) return "high";
  if (value >= 0.65) return "medium";
  return "low";
}

export function piecesToBoardObject(
  pieces: PlacedPiece[],
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const p of pieces) {
    const letter = p.type.toUpperCase();
    map[p.square] = p.color === "w" ? letter : letter.toLowerCase();
  }
  return map;
}

export function boardObjectToPieces(obj: Record<string, string>): PlacedPiece[] {
  const pieces: PlacedPiece[] = [];
  for (const [square, code] of Object.entries(obj)) {
    if (!code) continue;
    const upper = code.toUpperCase();
    pieces.push({
      square,
      color: code === upper ? "w" : "b",
      type: upper.toLowerCase() as PlacedPiece["type"],
    });
  }
  return pieces;
}

export function copyFenToClipboard(fen: string): Promise<void> {
  return navigator.clipboard.writeText(fen);
}

export function formatChessLoadError(raw: string): string {
  if (raw.includes("missing white king")) {
    return "Stillingen mangler hvit konge.";
  }
  if (raw.includes("missing black king")) {
    return "Stillingen mangler svart konge.";
  }
  if (raw.includes("Invalid FEN")) {
    return "Ugyldig sjakkstilling (FEN kan ikke lastes).";
  }
  return "Ugyldig sjakkstilling (FEN kan ikke lastes).";
}

export function tryCreateChess(
  fen: string,
): { ok: true; chess: Chess } | { ok: false; message: string } {
  if (!fen.trim()) {
    return { ok: false, message: "Ingen sjakkstilling er lastet." };
  }
  try {
    return { ok: true, chess: new Chess(fen) };
  } catch (error) {
    const raw = error instanceof Error ? error.message : "Invalid FEN";
    return { ok: false, message: formatChessLoadError(raw) };
  }
}

export function tryLoadChess(
  chess: Chess,
  fen: string,
): { ok: true } | { ok: false; message: string } {
  try {
    chess.load(fen);
    return { ok: true };
  } catch (error) {
    const raw = error instanceof Error ? error.message : "Invalid FEN";
    return { ok: false, message: formatChessLoadError(raw) };
  }
}

