import type { ColorMatrix } from "@/image/color-matrix";

/**
 * Web bake: apply the matrix per-pixel on a 2D canvas. Runs once at
 * save time, so the JS loop cost is acceptable; the live preview uses
 * a GPU-accelerated SVG filter with the same matrix instead.
 */
export async function bakeColorMatrix(
  uri: string,
  matrix: ColorMatrix,
): Promise<string> {
  const img = await loadImage(uri);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas context");

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  applyMatrix(imageData.data, matrix);
  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL("image/jpeg", 0.9);
}

function applyMatrix(data: Uint8ClampedArray, m: ColorMatrix) {
  // Matrix offsets are normalized 0..1; pixel channels are 0..255.
  const o = 255;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    data[i] = m[0] * r + m[1] * g + m[2] * b + m[3] * a + m[4] * o;
    data[i + 1] = m[5] * r + m[6] * g + m[7] * b + m[8] * a + m[9] * o;
    data[i + 2] = m[10] * r + m[11] * g + m[12] * b + m[13] * a + m[14] * o;
    data[i + 3] = m[15] * r + m[16] * g + m[17] * b + m[18] * a + m[19] * o;
  }
}

function loadImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = uri;
  });
}
