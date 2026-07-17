declare global {
  interface Window {
    cv?: OpenCvModule;
  }
}

export type OpenCvModule = {
  Mat: new () => OpenCvMat;
  MatVector: new () => OpenCvMatVector;
  imread: (canvas: HTMLCanvasElement) => OpenCvMat;
  cvtColor: (src: OpenCvMat, dst: OpenCvMat, code: number) => void;
  GaussianBlur: (src: OpenCvMat, dst: OpenCvMat, ksize: OpenCvSize, sigma: number) => void;
  Canny: (src: OpenCvMat, dst: OpenCvMat, t1: number, t2: number) => void;
  findContours: (
    image: OpenCvMat,
    contours: OpenCvMatVector,
    hierarchy: OpenCvMat,
    mode: number,
    method: number,
  ) => void;
  contourArea: (contour: OpenCvMat) => number;
  arcLength: (contour: OpenCvMat, closed: boolean) => number;
  approxPolyDP: (curve: OpenCvMat, approx: OpenCvMat, epsilon: number, closed: boolean) => void;
  isContourConvex: (contour: OpenCvMat) => boolean;
  resize: (src: OpenCvMat, dst: OpenCvMat, dsize: OpenCvSize) => void;
  COLOR_RGBA2GRAY: number;
  RETR_LIST: number;
  CHAIN_APPROX_SIMPLE: number;
  onRuntimeInitialized?: () => void;
};

type OpenCvMat = {
  rows: number;
  cols: number;
  delete: () => void;
  data32S: Int32Array;
  intPtr: (row: number, col: number) => number;
};

type OpenCvMatVector = {
  size: () => number;
  get: (index: number) => OpenCvMat;
  delete: () => void;
};

type OpenCvSize = { width: number; height: number };

const SCRIPT_ID = "opencv-js-script";
export const OPENCV_LOAD_TIMEOUT_MS = 5000;

let loadPromise: Promise<OpenCvModule | null> | null = null;

function loadOpenCvScript(): Promise<OpenCvModule | null> {
  return new Promise((resolve) => {
    const finish = (cv: OpenCvModule | null) => resolve(cv);

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.cv?.Mat) {
        finish(window.cv);
        return;
      }
      existing.addEventListener("load", () => {
        if (window.cv) {
          window.cv.onRuntimeInitialized = () => finish(window.cv ?? null);
        } else {
          finish(null);
        }
      });
      existing.addEventListener("error", () => finish(null));
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = "https://docs.opencv.org/4.9.0/opencv.js";
    script.onload = () => {
      if (!window.cv) {
        finish(null);
        return;
      }
      window.cv.onRuntimeInitialized = () => finish(window.cv ?? null);
    };
    script.onerror = () => finish(null);
    document.head.appendChild(script);
  });
}

export function loadOpenCv(): Promise<OpenCvModule | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.cv?.Mat) return Promise.resolve(window.cv);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, OPENCV_LOAD_TIMEOUT_MS);

    loadOpenCvScript()
      .then((cv) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(cv);
        }
      })
      .catch(() => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(null);
        }
      });
  });

  return loadPromise;
}

export function resetOpenCvLoaderForTests(): void {
  loadPromise = null;
}
