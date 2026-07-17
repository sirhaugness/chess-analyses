import type { OrderedCorners, Point } from "./board-geometry";
import { orderedCornersToArray } from "./board-geometry";

export const EXPORT_MAX_SIZE = 1600;
export const TARGET_MAX_BYTES = Math.floor(1.5 * 1024 * 1024);
export const ABSOLUTE_MAX_BYTES = Math.floor(2.5 * 1024 * 1024);
export const JPEG_QUALITIES = [0.82, 0.75, 0.68] as const;

export type ProcessedImage = {
  dataUrl: string;
  approximateSizeKb: number;
  width: number;
  height: number;
};

export function estimateDataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.floor((base64.length * 3) / 4);
}

export function approximateKbFromDataUrl(dataUrl: string): number {
  return Math.round(estimateDataUrlBytes(dataUrl) / 1024);
}

function solveLinearSystem(a: number[][], b: number[]): number[] | null {
  const n = b.length;
  const m = a.map((row) => [...row, ...b.slice()]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(m[row][col]) > Math.abs(m[pivot][col])) pivot = row;
    }
    if (Math.abs(m[pivot][col]) < 1e-10) return null;
    [m[col], m[pivot]] = [m[pivot], m[col]];
    const div = m[col][col];
    for (let j = col; j <= n; j++) m[col][j] /= div;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = m[row][col];
      for (let j = col; j <= n; j++) m[row][j] -= factor * m[col][j];
    }
  }
  return m.map((row) => row[n]);
}

/** Homography mapping output square coords -> source image coords */
export function computeHomography(srcQuad: Point[], dstQuad: Point[]): number[] | null {
  if (srcQuad.length !== 4 || dstQuad.length !== 4) return null;
  const a: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = dstQuad[i];
    const { x: xp, y: yp } = srcQuad[i];
    a.push([x, y, 1, 0, 0, 0, -xp * x, -xp * y]);
    b.push(xp);
    a.push([0, 0, 0, x, y, 1, -yp * x, -yp * y]);
    b.push(yp);
  }
  const h = solveLinearSystem(a, b);
  if (!h) return null;
  return [...h, 1];
}

function applyHomography(h: number[], x: number, y: number): Point | null {
  const denom = h[6] * x + h[7] * y + h[8];
  if (Math.abs(denom) < 1e-8) return null;
  return {
    x: (h[0] * x + h[1] * y + h[2]) / denom,
    y: (h[3] * x + h[4] * y + h[5]) / denom,
  };
}

function sampleBilinear(data: Uint8ClampedArray, w: number, h: number, x: number, y: number): [number, number, number, number] {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, w - 1);
  const y1 = Math.min(y0 + 1, h - 1);
  const tx = x - x0;
  const ty = y - y0;
  const idx = (px: number, py: number) => (py * w + px) * 4;
  const c00 = idx(x0, y0);
  const c10 = idx(x1, y0);
  const c01 = idx(x0, y1);
  const c11 = idx(x1, y1);
  const out: [number, number, number, number] = [0, 0, 0, 255];
  for (let i = 0; i < 3; i++) {
    const v00 = data[c00 + i];
    const v10 = data[c10 + i];
    const v01 = data[c01 + i];
    const v11 = data[c11 + i];
    out[i] = Math.round(
      v00 * (1 - tx) * (1 - ty) +
        v10 * tx * (1 - ty) +
        v01 * (1 - tx) * ty +
        v11 * tx * ty,
    );
  }
  return out;
}

export function warpPerspectiveFromImageData(
  source: ImageData,
  corners: OrderedCorners,
  outputSize: number,
): ImageData {
  const srcPts = orderedCornersToArray(corners);
  const dstPts: Point[] = [
    { x: 0, y: 0 },
    { x: outputSize - 1, y: 0 },
    { x: outputSize - 1, y: outputSize - 1 },
    { x: 0, y: outputSize - 1 },
  ];
  const h = computeHomography(srcPts, dstPts);
  if (!h) throw new Error("Kunne ikke beregne perspektivtransformasjon.");

  const out = new ImageData(outputSize, outputSize);
  for (let y = 0; y < outputSize; y++) {
    for (let x = 0; x < outputSize; x++) {
      const src = applyHomography(h, x, y);
      const di = (y * outputSize + x) * 4;
      if (!src || src.x < 0 || src.y < 0 || src.x >= source.width || src.y >= source.height) {
        out.data[di] = 0;
        out.data[di + 1] = 0;
        out.data[di + 2] = 0;
        out.data[di + 3] = 255;
        continue;
      }
      const [r, g, b, a] = sampleBilinear(source.data, source.width, source.height, src.x, src.y);
      out.data[di] = r;
      out.data[di + 1] = g;
      out.data[di + 2] = b;
      out.data[di + 3] = a;
    }
  }
  return out;
}

export function compressCanvasToJpeg(
  canvas: HTMLCanvasElement,
  qualities: readonly number[] = JPEG_QUALITIES,
): ProcessedImage {
  let lastDataUrl = "";
  for (const quality of qualities) {
    lastDataUrl = canvas.toDataURL("image/jpeg", quality);
    const bytes = estimateDataUrlBytes(lastDataUrl);
    if (bytes <= TARGET_MAX_BYTES) {
      return {
        dataUrl: lastDataUrl,
        approximateSizeKb: Math.round(bytes / 1024),
        width: canvas.width,
        height: canvas.height,
      };
    }
  }
  const bytes = estimateDataUrlBytes(lastDataUrl);
  if (bytes > ABSOLUTE_MAX_BYTES) {
    throw new Error("For stort bilde etter komprimering. Juster utsnittet og prøv igjen.");
  }
  return {
    dataUrl: lastDataUrl,
    approximateSizeKb: Math.round(bytes / 1024),
    width: canvas.width,
    height: canvas.height,
  };
}

export async function loadOrientedImageCanvas(imageSrc: string): Promise<HTMLCanvasElement> {
  const res = await fetch(imageSrc);
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas ikke tilgjengelig.");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return canvas;
}

export async function exportBoardFromCorners(
  imageSrc: string,
  corners: OrderedCorners,
  outputSize = EXPORT_MAX_SIZE,
): Promise<ProcessedImage> {
  const sourceCanvas = await loadOrientedImageCanvas(imageSrc);
  const ctx = sourceCanvas.getContext("2d");
  if (!ctx) throw new Error("Canvas ikke tilgjengelig.");
  const sourceData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const warped = warpPerspectiveFromImageData(sourceData, corners, outputSize);
  const outCanvas = document.createElement("canvas");
  outCanvas.width = outputSize;
  outCanvas.height = outputSize;
  const outCtx = outCanvas.getContext("2d");
  if (!outCtx) throw new Error("Canvas ikke tilgjengelig.");
  outCtx.putImageData(warped, 0, 0);
  return compressCanvasToJpeg(outCanvas);
}
