const MAX_INPUT_BYTES = 3 * 1024 * 1024;
const EXPORT_SIZE = 1400;
const JPEG_QUALITY = 0.86;

export type ProcessedImage = {
  dataUrl: string;
  approximateSizeKb: number;
  width: number;
  height: number;
};

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
  if (file.size > MAX_INPUT_BYTES) return "For stort bilde. Velg et mindre bilde.";
  return null;
}

export async function getCroppedImage(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation: number,
): Promise<ProcessedImage> {
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

  canvas.width = EXPORT_SIZE;
  canvas.height = EXPORT_SIZE;
  ctx.drawImage(
    rotCanvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    EXPORT_SIZE,
    EXPORT_SIZE,
  );

  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  const bytes = estimateDataUrlBytes(dataUrl);
  return {
    dataUrl,
    approximateSizeKb: Math.round(bytes / 1024),
    width: EXPORT_SIZE,
    height: EXPORT_SIZE,
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Kunne ikke laste bildet."));
    img.src = src;
  });
}

function estimateDataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.floor((base64.length * 3) / 4);
}

export function approximateKbFromDataUrl(dataUrl: string): number {
  return Math.round(estimateDataUrlBytes(dataUrl) / 1024);
}
