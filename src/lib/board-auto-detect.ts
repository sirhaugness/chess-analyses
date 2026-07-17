import type { OrderedCorners } from "./board-geometry";
import { orderCorners, scoreQuadCandidate } from "./board-geometry";
import { yieldToMain } from "./async-utils";
import { loadOpenCv } from "./opencv-loader";

export type BoardDetectionResult = {
  corners: OrderedCorners;
  confidence: number;
};

const WORK_MAX = 600;

function extractContourPoints(contour: {
  rows: number;
  intPtr: (row: number, col: number) => number;
}): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < contour.rows; i++) {
    points.push({ x: contour.intPtr(i, 0), y: contour.intPtr(i, 1) });
  }
  return points;
}

export function detectBoardWithOpenCv(
  cv: NonNullable<Awaited<ReturnType<typeof loadOpenCv>>>,
  sourceCanvas: HTMLCanvasElement,
): BoardDetectionResult | null {
  const fullW = sourceCanvas.width;
  const fullH = sourceCanvas.height;
  const scale = Math.min(1, WORK_MAX / Math.max(fullW, fullH));
  const workW = Math.max(1, Math.round(fullW * scale));
  const workH = Math.max(1, Math.round(fullH * scale));

  const src = cv.imread(sourceCanvas);
  const work = new cv.Mat();
  cv.resize(src, work, { width: workW, height: workH });

  const gray = new cv.Mat();
  cv.cvtColor(work, gray, cv.COLOR_RGBA2GRAY);
  cv.GaussianBlur(gray, gray, { width: 5, height: 5 }, 0);

  const edges = new cv.Mat();
  cv.Canny(gray, edges, 50, 150);

  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

  let best: BoardDetectionResult | null = null;

  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    const area = cv.contourArea(contour);
    if (area < workW * workH * 0.08) continue;

    const peri = cv.arcLength(contour, true);
    const approx = new cv.Mat();
    cv.approxPolyDP(contour, approx, 0.02 * peri, true);

    if (approx.rows === 4 && cv.isContourConvex(approx)) {
      const pts = extractContourPoints(approx).map((p) => ({
        x: p.x / scale,
        y: p.y / scale,
      }));
      const confidence = scoreQuadCandidate(pts, fullW, fullH);
      if (!best || confidence > best.confidence) {
        best = { corners: orderCorners(pts), confidence };
      }
    }
    approx.delete();
  }

  src.delete();
  work.delete();
  gray.delete();
  edges.delete();
  contours.delete();
  hierarchy.delete();

  return best;
}

export async function detectChessboardFromCanvas(
  canvas: HTMLCanvasElement,
): Promise<BoardDetectionResult | null> {
  try {
    await yieldToMain();
    const cv = await loadOpenCv();
    if (!cv) return null;
    await yieldToMain();
    return detectBoardWithOpenCv(cv, canvas);
  } catch {
    return null;
  }
}

export function defaultFullImageCorners(width: number, height: number): OrderedCorners {
  const m = Math.min(width, height) * 0.1;
  return {
    topLeft: { x: m, y: m },
    topRight: { x: width - m, y: m },
    bottomRight: { x: width - m, y: height - m },
    bottomLeft: { x: m, y: height - m },
  };
}
