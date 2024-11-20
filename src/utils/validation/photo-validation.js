export const validatePhoto = (file) => {
    const errors = [];
    
    if (!file) {
      errors.push('No file provided');
      return errors;
    }
  
    // Size validation
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }
  
    // Type validation
    if (!ACCEPTED_TYPES.includes(file.type)) {
      errors.push('File must be a valid image (JPG, PNG, or WebP)');
    }
  
    // Image dimensions validation
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        if (img.width < 200 || img.height < 200) {
          errors.push('Image dimensions must be at least 200x200 pixels');
        }
        resolve(errors);
      };
  
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        errors.push('Failed to load image');
        resolve(errors);
      };
  
      img.src = objectUrl;
    });
  };