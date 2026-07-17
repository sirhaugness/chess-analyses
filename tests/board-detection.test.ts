import { describe, expect, it, vi } from "vitest";
import {
  orderCorners,
  scoreQuadCandidate,
  shouldUseAutoCrop,
  AUTO_CROP_CONFIDENCE_THRESHOLD,
} from "../src/lib/board-geometry";
import {
  computeHomography,
  estimateDataUrlBytes,
  warpPerspectiveFromImageData,
  warpPerspectiveFromImageDataAsync,
} from "../src/lib/perspective-export";
import { DETECTION_TIMEOUT_MS, withTimeout, yieldToMain } from "../src/lib/async-utils";

describe("orderCorners", () => {
  it("sorts four corners into topLeft, topRight, bottomRight, bottomLeft", () => {
    const ordered = orderCorners([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ]);
    expect(ordered.topLeft).toEqual({ x: 0, y: 0 });
    expect(ordered.topRight).toEqual({ x: 100, y: 0 });
    expect(ordered.bottomRight).toEqual({ x: 100, y: 100 });
    expect(ordered.bottomLeft).toEqual({ x: 0, y: 100 });
  });
});

describe("scoreQuadCandidate", () => {
  it("gives high confidence for a centered square", () => {
    const score = scoreQuadCandidate(
      [
        { x: 100, y: 100 },
        { x: 300, y: 100 },
        { x: 300, y: 300 },
        { x: 100, y: 300 },
      ],
      400,
      400,
    );
    expect(score).toBeGreaterThan(0.7);
  });

  it("gives low confidence for tiny quads", () => {
    const score = scoreQuadCandidate(
      [
        { x: 10, y: 10 },
        { x: 12, y: 10 },
        { x: 12, y: 12 },
        { x: 10, y: 12 },
      ],
      400,
      400,
    );
    expect(score).toBeLessThan(AUTO_CROP_CONFIDENCE_THRESHOLD);
  });
});

describe("shouldUseAutoCrop", () => {
  it("opens manual fallback when confidence is low", () => {
    expect(shouldUseAutoCrop(0.9)).toBe(true);
    expect(shouldUseAutoCrop(0.3)).toBe(false);
  });
});

describe("warpPerspectiveFromImageData", () => {
  it("produces a square output from a source quad", () => {
    const size = 8;
    const source = new ImageData(size, size);
    for (let i = 0; i < source.data.length; i += 4) {
      source.data[i] = 200;
      source.data[i + 1] = 180;
      source.data[i + 2] = 140;
      source.data[i + 3] = 255;
    }
    const corners = orderCorners([
      { x: 1, y: 1 },
      { x: 7, y: 1 },
      { x: 7, y: 7 },
      { x: 1, y: 7 },
    ]);
    const out = warpPerspectiveFromImageData(source, corners, 4);
    expect(out.width).toBe(4);
    expect(out.height).toBe(4);
    expect(out.data[0]).toBeGreaterThan(0);
  });

  it("async warp matches sync warp for small images", async () => {
    const source = new ImageData(8, 8);
    for (let i = 0; i < source.data.length; i += 4) {
      source.data[i] = 100;
      source.data[i + 3] = 255;
    }
    const corners = orderCorners([
      { x: 0, y: 0 },
      { x: 7, y: 0 },
      { x: 7, y: 7 },
      { x: 0, y: 7 },
    ]);
    const sync = warpPerspectiveFromImageData(source, corners, 4);
    const asyncOut = await warpPerspectiveFromImageDataAsync(source, corners, 4);
    expect(asyncOut.width).toBe(sync.width);
    expect(asyncOut.height).toBe(sync.height);
    expect(asyncOut.data[0]).toBe(sync.data[0]);
  });

  it("computes homography for square mapping", () => {
    const h = computeHomography(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ],
      [
        { x: 0, y: 0 },
        { x: 3, y: 0 },
        { x: 3, y: 3 },
        { x: 0, y: 3 },
      ],
    );
    expect(h).not.toBeNull();
    expect(h?.length).toBe(9);
  });
});

describe("export compression", () => {
  it("accepts jpeg data under absolute max size", () => {
    const small = "data:image/jpeg;base64," + "A".repeat(1200);
    expect(estimateDataUrlBytes(small)).toBeLessThan(1.5 * 1024 * 1024);
  });
});

describe("async-utils", () => {
  it("withTimeout resolves before deadline", async () => {
    const result = await withTimeout(Promise.resolve(42), 100);
    expect(result).toBe(42);
  });

  it("withTimeout returns timeout when promise is slow", async () => {
    vi.useFakeTimers();
    const slow = new Promise<number>((resolve) => setTimeout(() => resolve(1), 5000));
    const pending = withTimeout(slow, 50);
    vi.advanceTimersByTime(60);
    await expect(pending).resolves.toBe("timeout");
    vi.useRealTimers();
  });

  it("DETECTION_TIMEOUT_MS is within expected range", () => {
    expect(DETECTION_TIMEOUT_MS).toBeGreaterThanOrEqual(3000);
    expect(DETECTION_TIMEOUT_MS).toBeLessThanOrEqual(5000);
  });

  it("yieldToMain resolves", async () => {
    await expect(yieldToMain()).resolves.toBeUndefined();
  });
});

describe("detectChessboardFromCanvas when OpenCV unavailable", () => {
  it("returns null without throwing", async () => {
    vi.resetModules();
    vi.doMock("../src/lib/opencv-loader", () => ({
      loadOpenCv: vi.fn().mockResolvedValue(null),
    }));
    const { detectChessboardFromCanvas } = await import("../src/lib/board-auto-detect");
    const canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = 100;
    const result = await detectChessboardFromCanvas(canvas);
    expect(result).toBeNull();
  });
});

describe("BoardCropFlow fallback logic", () => {
  it("uses manual mode for low confidence detection", () => {
    expect(shouldUseAutoCrop(0.4)).toBe(false);
  });

  it("timeout constant supports manual fallback window", () => {
    expect(DETECTION_TIMEOUT_MS).toBe(4000);
  });
});
