import { describe, expect, it, vi } from "vitest";
import { validateImageFile, PREPARE_MAX_EDGE } from "../src/lib/image-processing";
import {
  ABSOLUTE_MAX_BYTES,
  TARGET_MAX_BYTES,
  compressCanvasToJpeg,
  estimateDataUrlBytes,
} from "../src/lib/perspective-export";

describe("validateImageFile", () => {
  it("accepts large camera photos without a size error", () => {
    const big = new File([new Uint8Array(8 * 1024 * 1024)], "photo.jpg", {
      type: "image/jpeg",
    });
    expect(validateImageFile(big)).toBeNull();
  });

  it("rejects unsupported file types", () => {
    const pdf = new File(["x"], "doc.pdf", { type: "application/pdf" });
    expect(validateImageFile(pdf)).toMatch(/filtype/i);
  });
});

describe("PREPARE_MAX_EDGE", () => {
  it("keeps working copies within a reasonable pixel budget", () => {
    expect(PREPARE_MAX_EDGE).toBeGreaterThanOrEqual(1600);
    expect(PREPARE_MAX_EDGE).toBeLessThanOrEqual(4096);
  });
});

describe("compressCanvasToJpeg", () => {
  it("never throws and stays under the absolute upload limit", () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 1600;
    vi.spyOn(canvas, "toDataURL").mockImplementation((_type, quality) => {
      const q = typeof quality === "number" ? quality : 0.82;
      const payloadLen = Math.round(ABSOLUTE_MAX_BYTES * 1.2 * q);
      return `data:image/jpeg;base64,${"A".repeat(payloadLen)}`;
    });

    const result = compressCanvasToJpeg(canvas);
    expect(result.dataUrl.startsWith("data:image/jpeg")).toBe(true);
    expect(estimateDataUrlBytes(result.dataUrl)).toBeLessThanOrEqual(ABSOLUTE_MAX_BYTES);
  });

  it("targets a size suitable for the API", () => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 800;
    vi.spyOn(canvas, "toDataURL").mockImplementation((_type, quality) => {
      const q = typeof quality === "number" ? quality : 0.82;
      const payloadLen = Math.round(TARGET_MAX_BYTES * 0.5 * q);
      return `data:image/jpeg;base64,${"A".repeat(payloadLen)}`;
    });

    const result = compressCanvasToJpeg(canvas);
    expect(estimateDataUrlBytes(result.dataUrl)).toBeLessThanOrEqual(TARGET_MAX_BYTES);
  });
});

describe("prepareImageFromFile", () => {
  it("downscales and compresses large files", async () => {
    const draw = vi.fn((source: CanvasImageSource, ...args: number[]) => {
      void source;
      void args;
    });
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({
        width: 6000,
        height: 4000,
        close: vi.fn(),
      })),
    );

    const canvasProto = HTMLCanvasElement.prototype;
    const getContext = vi
      .spyOn(canvasProto, "getContext")
      .mockReturnValue({ drawImage: draw } as unknown as CanvasRenderingContext2D);
    const toDataUrl = vi
      .spyOn(canvasProto, "toDataURL")
      .mockReturnValue("data:image/jpeg;base64," + "A".repeat(4000));

    const { prepareImageFromFile } = await import("../src/lib/image-processing");
    const file = new File(["x"], "big.jpg", { type: "image/jpeg" });
    const result = await prepareImageFromFile(file);

    expect(createImageBitmap).toHaveBeenCalledWith(file, { imageOrientation: "from-image" });
    expect(result.dataUrl).toContain("image/jpeg");
    expect(result.width).toBeLessThanOrEqual(PREPARE_MAX_EDGE);
    expect(result.height).toBeLessThanOrEqual(PREPARE_MAX_EDGE);

    getContext.mockRestore();
    toDataUrl.mockRestore();
    vi.unstubAllGlobals();
  });
});
