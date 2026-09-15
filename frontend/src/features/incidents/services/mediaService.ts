/**
 * MediaService: Image compression, validation, and multi-photo handling
 */
export class MediaService {
  private static MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit before compression
  private static ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  public static MAX_PHOTOS = 3;

  /**
   * Validate image file format and initial size
   */
  static validateImage(file: File): { valid: boolean; error?: string } {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported format (${file.type}). Allowed: JPG, PNG, WEBP`,
      };
    }

    if (file.size > this.MAX_PHOTO_SIZE_BYTES) {
      return {
        valid: false,
        error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max limit is 5MB.`,
      };
    }

    return { valid: true };
  }

  /**
   * Compress image client-side to save field mobile bandwidth
   */
  static async compressImage(
    file: File | Blob,
    maxWidth = 1280,
    quality = 0.75
  ): Promise<{ blob: Blob; dataUrl: string; sizeBytes: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context creation failed"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                blob,
                dataUrl,
                sizeBytes: blob.size,
              });
            } else {
              reject(new Error("Image compression failed"));
            }
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to load image for compression"));
      };

      img.src = objectUrl;
    });
  }

  /**
   * Convert file to base64 for offline SQLite/LocalStore persistence
   */
  static async fileToBase64(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
