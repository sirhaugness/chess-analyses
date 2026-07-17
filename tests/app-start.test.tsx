import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../src/App";
import { tryCreateChess } from "../src/lib/chess-position";
import { buildFen, defaultMeta } from "../src/lib/chess-position";

describe("App startup", () => {
  it("renders upload screen without an initial FEN", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "Ta bilde" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Borhaug Open" })).toBeInTheDocument();
  });
});

describe("tryCreateChess", () => {
  it("rejects empty placement without throwing", () => {
    const fen = buildFen([], defaultMeta("w"));
    const result = tryCreateChess(fen);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/konge|ugyldig/i);
    }
  });

  it("accepts standard start position", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const result = tryCreateChess(fen);
    expect(result.ok).toBe(true);
  });
});
