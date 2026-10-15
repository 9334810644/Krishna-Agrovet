/**
 * Utility for client-side image optimization & canvas downscaling.
 * Converts camera/device photos into compressed base64 Data URLs suitable for
 * Firestore documents, local storage, and instant visual preview.
 */

export interface CompressionResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  fileName: string;
}

export const compressDeviceImage = async (
  file: File,
  maxDimension: number = 900,
  quality: number = 0.85
): Promise<CompressionResult> => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file (JPG, PNG, WEBP, or SVG).');
  }

  // Handle SVGs without rasterization
  if (file.type === 'image/svg+xml') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve({
          dataUrl,
          originalSize: file.size,
          compressedSize: dataUrl.length,
          fileName: file.name,
        });
      };
      reader.onerror = () => reject(new Error('Failed to read SVG file.'));
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          const fallback = event.target?.result as string;
          resolve({
            dataUrl: fallback,
            originalSize: file.size,
            compressedSize: fallback.length,
            fileName: file.name,
          });
          return;
        }

        // Draw and compress to JPEG
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);

        resolve({
          dataUrl: compressed,
          originalSize: file.size,
          compressedSize: compressed.length,
          fileName: file.name,
        });
      };

      img.onerror = () => {
        reject(new Error('Failed to decode image from device. Please try another photo.'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file from your device.'));
    };

    reader.readAsDataURL(file);
  });
};
