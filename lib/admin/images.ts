// Browser-side photo preparation for the admin product form. Compresses and
// resizes before upload so each Server Action stays well under its body limit.

const MAX_DIMENSION = 1600;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number | undefined,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function encodeAtQuality(
  source: CanvasImageSource,
  width: number,
  height: number,
  type: string,
  quality: number | undefined,
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);
  return canvasToBlob(canvas, type, quality);
}

/**
 * Validate, resize (longest side 1600 px) and compress a picked photo.
 * Throws a plain-English Error the form can show directly.
 */
export async function prepareProductImage(file: File): Promise<File> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("That file is not a photo. Choose a JPG, PNG, or WebP image.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("That file could not be read as an image. Choose a JPG, PNG, or WebP photo.");
  }

  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const type = file.type === "image/png" ? "image/png" : "image/jpeg";
    const qualities = type === "image/png" ? [undefined] : [0.85, 0.72, 0.6, 0.45];
    let blob: Blob | null = null;

    for (const quality of qualities) {
      blob = await encodeAtQuality(bitmap, width, height, type, quality);
      if (blob && blob.size <= MAX_BYTES) {
        break;
      }
    }

    if (!blob || blob.size > MAX_BYTES) {
      // Last resort: shrink the resized dimensions and try once more.
      const shrink = Math.min(1, 1000 / Math.max(width, height));
      const smallWidth = Math.max(1, Math.round(width * shrink));
      const smallHeight = Math.max(1, Math.round(height * shrink));
      blob = await encodeAtQuality(bitmap, smallWidth, smallHeight, "image/jpeg", 0.6);
    }

    if (!blob || blob.size === 0) {
      throw new Error("That photo could not be processed. Try a different image.");
    }
    if (blob.size > MAX_BYTES) {
      throw new Error("That photo is still too large after resizing. Try a smaller image.");
    }

    const extension = type === "image/png" ? "png" : "jpg";
    const name = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${name}.${extension}`, { type });
  } finally {
    bitmap.close();
  }
}
