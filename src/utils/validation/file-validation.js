export const MAX_DIMENSIONS = {
  width: 1200,
  height: 1500
};

export const MIN_DIMENSIONS = {
  width: 400,
  height: 400
};

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const validateImageFile = async (file) => {
  const errors = [];

  // Type validation
  if (!ACCEPTED_TYPES.includes(file.type)) {
    errors.push(`Invalid file type: ${file.type}. Accepted types: JPEG, PNG, WebP`);
  }

  // Size validation
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size: 10MB`);
  }

  try {
    const dimensions = await getImageDimensions(file);
    
    // Minimum dimensions
    if (dimensions.width < MIN_DIMENSIONS.width || dimensions.height < MIN_DIMENSIONS.height) {
      errors.push(`Image too small. Minimum dimensions: ${MIN_DIMENSIONS.width}x${MIN_DIMENSIONS.height}px`);
    }

    // Maximum dimensions
    if (dimensions.width > MAX_DIMENSIONS.width || dimensions.height > MAX_DIMENSIONS.height) {
      errors.push(`Image too large. Maximum dimensions: ${MAX_DIMENSIONS.width}x${MAX_DIMENSIONS.height}px`);
    }
  } catch (error) {
    errors.push('Failed to validate image dimensions');
  }

  return errors;
};

export const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        width: img.width,
        height: img.height,
        aspectRatio: img.width / img.height
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
};

export const requiresCropping = async (file, targetAspectRatio = 4/5) => {
  try {
    const dimensions = await getImageDimensions(file);
    const currentRatio = dimensions.width / dimensions.height;
    return Math.abs(currentRatio - targetAspectRatio) > 0.01;
  } catch (error) {
    console.error('Error checking crop requirement:', error);
    return true; // If we can't determine, better to show cropper
  }
};

export const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};