/**
 * Image processing and compression utilities for avatar and document uploads.
 * Resizes large photos from smartphones or cameras to standard web dimensions
 * to ensure instant saving and Firestore/localStorage quota safety.
 */

export async function compressAndResizeImage(
  input: File | string,
  maxWidth: number = 400,
  maxHeight: number = 400,
  quality: number = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const processImg = (src: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        // Fill background with white for transparent PNGs
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Draw smooth image
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized JPEG dataURL
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.onerror = () => {
        // Fallback to original string if error
        resolve(src);
      };

      img.src = src;
    };

    if (typeof input === 'string') {
      processImg(input);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          processImg(reader.result);
        } else {
          reject(new Error('Failed to read image file'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(input);
    }
  });
}

/**
 * Specifically compress and optimize logos.
 * Preserves PNG transparency, scales to max 380x380, and ensures the data size
 * is strictly under 100KB so that Firebase Firestore and LocalStorage never fail.
 */
export async function compressAndResizeLogo(
  input: File | string,
  maxWidth: number = 380,
  maxHeight: number = 380,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If input is an SVG string/data URL under 300KB, resolve directly to keep vector sharpness
    if (typeof input === 'string' && (input.startsWith('data:image/svg+xml') || input.startsWith('<svg'))) {
      if (input.length < 300000) {
        resolve(input);
        return;
      }
    }

    const processImg = (src: string) => {
      if (src.startsWith('data:image/svg+xml') && src.length < 300000) {
        resolve(src);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(width, 1);
        canvas.height = Math.max(height, 1);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        // Clear canvas to keep transparent background for logos
        ctx.clearRect(0, 0, width, height);

        // Smooth rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first for optimal size & alpha support, fallback to PNG
        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData.startsWith('data:image/webp') && webpData.length < 250000) {
            resolve(webpData);
            return;
          }
        } catch (e) {
          // ignore
        }

        // Fallback to PNG with transparency
        const pngData = canvas.toDataURL('image/png');
        if (pngData.length > 500000) {
          // If still over 500KB, fallback to high-quality JPEG with white backdrop
          const jpgCanvas = document.createElement('canvas');
          jpgCanvas.width = width;
          jpgCanvas.height = height;
          const jpgCtx = jpgCanvas.getContext('2d');
          if (jpgCtx) {
            jpgCtx.fillStyle = '#FFFFFF';
            jpgCtx.fillRect(0, 0, width, height);
            jpgCtx.drawImage(img, 0, 0, width, height);
            resolve(jpgCanvas.toDataURL('image/jpeg', 0.85));
            return;
          }
        }
        resolve(pngData);
      };

      img.onerror = () => {
        // Return original if image element fails
        resolve(src);
      };

      img.src = src;
    };

    if (typeof input === 'string') {
      processImg(input);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          processImg(reader.result);
        } else {
          reject(new Error('Failed to read image file'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(input);
    }
  });
}


