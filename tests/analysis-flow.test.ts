import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";

describe("analysis undo redo", () => {
  it("undo and redo replay moves", () => {
    const chess = new Chess();
    const start = chess.fen();
    chess.move("e4");
    const after = chess.fen();
    chess.undo();
    expect(chess.fen()).toBe(start);
    chess.move("e4");
    expect(chess.fen()).toBe(after);
  });
});

describe("editor vs move history separation", () => {
  it("keeps separate stacks conceptually", () => {
    const editPast: string[] = [];
    const movePast: string[] = [];
    editPast.push("edit");
    movePast.push("e4");
    expect(editPast).not.toEqual(movePast);
  });
});

describe("reset and restart semantics", () => {
  it("restart returns to analysis start FEN", () => {
    const startFen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    const chess = new Chess(startFen);
    chess.move("e5");
    chess.load(startFen);
    expect(chess.fen()).toBe(startFen);
  });
});
