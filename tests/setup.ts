import "@testing-library/jest-dom/vitest";

class TestImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  colorSpace = "srgb" as const;

  constructor(sw: number, sh: number) {
    this.width = sw;
    this.height = sh;
    this.data = new Uint8ClampedArray(sw * sh * 4);
  }
}

if (typeof globalThis.ImageData === "undefined") {
  globalThis.ImageData = TestImageData as unknown as typeof ImageData;
}
