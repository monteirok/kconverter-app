import imageCompression from 'browser-image-compression';
import pica from 'pica';

export interface ConvertImageOptions {
  format: string; // 'jpg', 'png', etc.
  quality?: number; // 1-100
  width?: number;
  height?: number;
}

export async function convertImage(file: File, options: ConvertImageOptions): Promise<Blob> {
  const { format, quality = 80, width, height } = options;
  let inputFile = file;

  // Resize if needed
  let resizedFile = file;
  if (width || height) {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    await new Promise(res => (img.onload = res));
    const canvas = document.createElement('canvas');
    canvas.width = width || img.width;
    canvas.height = height || img.height;
    await pica().resize(img, canvas);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, `image/${format}`));
    if (blob) resizedFile = new File([blob], file.name, { type: `image/${format}` });
    URL.revokeObjectURL(img.src);
  }

  // Compress/convert
  const output = await imageCompression(resizedFile, {
    fileType: `image/${format}`,
    initialQuality: quality / 100,
    maxWidthOrHeight: Math.max(width || 0, height || 0) || undefined,
  });
  return output instanceof Blob ? output : new Blob([output], { type: `image/${format}` });
} 