export type Point = { x: number; y: number };

export type OrderedCorners = {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
};

export const AUTO_CROP_CONFIDENCE_THRESHOLD = 0.55;

export function orderCorners(points: Point[]): OrderedCorners {
  if (points.length !== 4) {
    throw new Error("Expected exactly four corner points.");
  }

  const bySum = [...points].sort((a, b) => a.x + a.y - (b.x + b.y));
  const byDiff = [...points].sort((a, b) => a.y - a.x - (b.y - b.x));

  return {
    topLeft: bySum[0],
    bottomRight: bySum[3],
    topRight: byDiff[0],
    bottomLeft: byDiff[3],
  };
}

export function orderedCornersToArray(c: OrderedCorners): Point[] {
  return [c.topLeft, c.topRight, c.bottomRight, c.bottomLeft];
}

export function quadArea(points: Point[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function quadCenter(points: Point[]): Point {
  const x = points.reduce((s, p) => s + p.x, 0) / points.length;
  const y = points.reduce((s, p) => s + p.y, 0) / points.length;
  return { x, y };
}

export function scoreQuadCandidate(
  points: Point[],
  imageWidth: number,
  imageHeight: number,
): number {
  if (points.length !== 4 || imageWidth <= 0 || imageHeight <= 0) return 0;

  const ordered = orderCorners(points);
  const corners = orderedCornersToArray(ordered);
  const imageArea = imageWidth * imageHeight;
  const area = quadArea(corners);
  const areaRatio = area / imageArea;

  if (areaRatio < 0.08 || areaRatio > 0.92) return 0;

  const top = distance(ordered.topLeft, ordered.topRight);
  const bottom = distance(ordered.bottomLeft, ordered.bottomRight);
  const left = distance(ordered.topLeft, ordered.bottomLeft);
  const right = distance(ordered.topRight, ordered.bottomRight);

  const avgW = (top + bottom) / 2;
  const avgH = (left + right) / 2;
  if (avgW < 20 || avgH < 20) return 0;

  const aspect = avgW / avgH;
  const squareness = 1 - Math.min(1, Math.abs(aspect - 1));
  const areaScore = areaRatio >= 0.15 && areaRatio <= 0.85 ? 1 : 0.6;

  const center = quadCenter(corners);
  const imgCenter = { x: imageWidth / 2, y: imageHeight / 2 };
  const maxDist = Math.hypot(imageWidth, imageHeight) / 2;
  const centrality = 1 - Math.min(1, distance(center, imgCenter) / maxDist);

  const parallelTop = Math.min(top, bottom) / Math.max(top, bottom);
  const parallelSide = Math.min(left, right) / Math.max(left, right);
  const parallelism = (parallelTop + parallelSide) / 2;

  const score =
    areaScore * 0.35 +
    squareness * 0.25 +
    centrality * 0.2 +
    parallelism * 0.2;

  return Math.max(0, Math.min(1, score));
}

export function shouldUseAutoCrop(confidence: number): boolean {
  return confidence >= AUTO_CROP_CONFIDENCE_THRESHOLD;
}

export function scaleCorners(corners: OrderedCorners, scale: number): OrderedCorners {
  const s = (p: Point): Point => ({ x: p.x / scale, y: p.y / scale });
  return {
    topLeft: s(corners.topLeft),
    topRight: s(corners.topRight),
    bottomRight: s(corners.bottomRight),
    bottomLeft: s(corners.bottomLeft),
  };
}

export function clampCorner(point: Point, width: number, height: number): Point {
  return {
    x: Math.max(0, Math.min(width - 1, point.x)),
    y: Math.max(0, Math.min(height - 1, point.y)),
  };
}
