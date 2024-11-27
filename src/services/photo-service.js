class PhotoService {
  static generatePhotoId(type, originalName) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const safeName = originalName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    return `${type}-${timestamp}-${random}-${safeName}`;
  }

  static async validatePhoto(file) {
    const errors = [];
    
    // File type validation
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      errors.push('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
    }

    // File size validation
    if (file.size > 10 * 1024 * 1024) { // 10MB
      errors.push('File size too large. Maximum size is 10MB.');
    }

    // Image dimensions validation
    try {
      const dimensions = await this.getImageDimensions(file);
      if (dimensions.width < 400 || dimensions.height < 400) {
        errors.push('Image dimensions too small. Minimum size is 400x400 pixels.');
      }
    } catch (error) {
      errors.push('Failed to validate image dimensions.');
    }

    return errors;
  }

  static getImageDimensions(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({
          width: img.width,
          height: img.height
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };

      img.src = objectUrl;
    });
  }

  static async processImage(file, options = {}) {
    const {
      maxWidth = 1200,
      maxHeight = 1500,
      quality = 0.9,
      aspectRatio = 4/5
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        // Calculate dimensions maintaining aspect ratio
        let { width, height } = img;
        const currentRatio = width / height;
        
        if (currentRatio > aspectRatio) {
          // Image is too wide
          width = height * aspectRatio;
        } else if (currentRatio < aspectRatio) {
          // Image is too tall
          height = width / aspectRatio;
        }

        // Apply max dimensions
        if (width > maxWidth || height > maxHeight) {
          const scale = Math.min(maxWidth / width, maxHeight / height);
          width *= scale;
          height *= scale;
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to process image'));
              return;
            }

            const processedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve({
              file: processedFile,
              dimensions: { width, height }
            });
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };

      img.src = objectUrl;
    });
  }

  static async preparePhotoForUpload(file) {
    // Validate
    const validationErrors = await this.validatePhoto(file);
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join('\n'));
    }

    // Process
    const { file: processedFile, dimensions } = await this.processImage(file);

    // Create staged photo object
    return {
      id: this.generatePhotoId('staged', file.name),
      file: processedFile,
      url: URL.createObjectURL(processedFile),
      dimensions,
      isStaged: true
    };
  }

  static isStaged(photoId) {
    return photoId.startsWith('staged-');
  }

  // Helper method for cleanup
  static revokeObjectURL(url) {
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
}

export default PhotoService;