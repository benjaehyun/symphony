export class PhotoUploadError extends Error {
    constructor(type, message, details = {}) {
      super(message);
      this.name = 'PhotoUploadError';
      this.type = type;
      this.details = details;
    }
  
    static validation(message, details) {
      return new PhotoUploadError('validation', message, details);
    }
  
    static network(message, details) {
      return new PhotoUploadError('network', message, details);
    }
  
    static processing(message, details) {
      return new PhotoUploadError('processing', message, details);
    }
  }
  
  export const handlePhotoError = (error) => {
    if (error instanceof PhotoUploadError) {
      return {
        type: error.type,
        message: error.message,
        details: error.details
      };
    }
  
    // Network errors
    if (error.name === 'NetworkError' || !navigator.onLine) {
      return {
        type: 'network',
        message: 'Network connection issue. Please check your internet connection.',
        details: { original: error }
      };
    }
  
    // File system errors
    if (error.name === 'NotReadableError') {
      return {
        type: 'file',
        message: 'Could not read the image file. The file might be corrupted.',
        details: { original: error }
      };
    }
  
    // Default error
    return {
      type: 'unknown',
      message: 'An unexpected error occurred while processing your photo.',
      details: { original: error }
    };
  };