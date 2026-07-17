export type { ProcessedImage } from "./perspective-export";
export {
  approximateKbFromDataUrl,
  EXPORT_MAX_SIZE,
  compressCanvasToJpeg,
  estimateDataUrlBytes,
} from "./perspective-export";
import { compressCanvasToJpeg, EXPORT_MAX_SIZE } from "./perspective-export";
import { yieldToMain } from "./async-utils";

/** Max longest edge for the working copy used in crop/detection (keeps memory and OpenCV fast). */
export const PREPARE_MAX_EDGE = 2400;

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Kunne ikke lese filen."));
    reader.readAsDataURL(file);
  });
}

export function validateImageFile(file: File): string | null {
  if (!file) return "Ingen fil valgt.";
  const ok = ["image/jpeg", "image/png", "image/webp"];
  if (!ok.includes(file.type)) return "Ugyldig filtype. Bruk JPEG, PNG eller WebP.";
  return null;
}

/** Downscale and compress camera/gallery photos so large files never block the flow. */
export async function prepareImageFromFile(
  file: File,
): Promise<import("./perspective-export").ProcessedImage> {
  await yieldToMain();
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, PREPARE_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Canvas ikke tilgjengelig.");
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  await yieldToMain();
  return compressCanvasToJpeg(canvas, [0.88, 0.82, 0.75, 0.68]);
}

export async function getCroppedImage(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation: number,
): Promise<import("./perspective-export").ProcessedImage> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas ikke tilgjengelig.");

  const rot = ((rotation % 360) + 360) % 360;
  const rad = (rot * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const bW = image.width * cos + image.height * sin;
  const bH = image.width * sin + image.height * cos;

  const rotCanvas = document.createElement("canvas");
  rotCanvas.width = bW;
  rotCanvas.height = bH;
  const rctx = rotCanvas.getContext("2d");
  if (!rctx) throw new Error("Canvas ikke tilgjengelig.");
  rctx.translate(bW / 2, bH / 2);
  rctx.rotate(rad);
  rctx.drawImage(image, -image.width / 2, -image.height / 2);

  canvas.width = EXPORT_MAX_SIZE;
  canvas.height = EXPORT_MAX_SIZE;
  ctx.drawImage(
    rotCanvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    EXPORT_MAX_SIZE,
    EXPORT_MAX_SIZE,
  );

  return compressCanvasToJpeg(canvas);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Kunne ikke laste bildet."));
    img.src = src;
  });
}
