/**
 * Utility to compress uploaded images via HTML5 Canvas
 * Reduces high-resolution image uploads (e.g. 5MB PNG) down to ~20KB - 50KB Data URLs,
 * preventing browser localStorage QuotaExceededError.
 */
export function compressImageFile(
  file: File,
  maxWidth = 450,
  maxHeight = 450,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (e) => {
      const resultStr = e.target?.result as string;
      if (!resultStr) {
        reject(new Error('Failed to read image file'));
        return;
      }

      const img = new Image();
      img.onerror = (err) => reject(err);
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(resultStr);
          return;
        }

        // Enable smooth image scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Keep transparent PNG if image is PNG, otherwise PNG or WebP
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/webp';
        try {
          const compressedDataUrl = canvas.toDataURL(mimeType, quality);
          resolve(compressedDataUrl);
        } catch (err) {
          resolve(resultStr);
        }
      };
      img.src = resultStr;
    };
    reader.readAsDataURL(file);
  });
}
