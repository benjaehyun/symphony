// services/photo-service.js
import { uploadToS3, deleteFromS3 } from '../utils/aws/s3-upload';
import { validatePhoto } from '../utils/validation/photo-validation';

export class PhotoService {
  static async uploadPhoto(file, userId, onProgress) {
    try {
      // Validate photo
      const errors = await validatePhoto(file);
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      // Compress image if needed
      const processedFile = await this.processImage(file);

      // Upload to S3
      const { url, key } = await uploadToS3(processedFile, userId);

      return { url, key };
    } catch (error) {
      console.error('Photo upload error:', error);
      throw error;
    }
  }

  static async processImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Max dimensions
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;

        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            resolve(new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            }));
          },
          'image/jpeg',
          0.8 // Quality
        );
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  static async deletePhoto(key) {
    try {
      await deleteFromS3(key);
    } catch (error) {
      console.error('Photo deletion error:', error);
      throw error;
    }
  }
}