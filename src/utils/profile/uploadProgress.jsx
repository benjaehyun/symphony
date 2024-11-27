import { uploadProfilePhotos, setUploadProgress } from '../store/slices/profileSlice';

export const uploadProgressMiddleware = (store) => (next) => (action) => {
  if (action.type === uploadProfilePhotos.pending.type) {
    // Reset progress when upload starts
    store.dispatch(setUploadProgress(0));

    // Setup XMLHttpRequest interceptor for progress tracking
    const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
      const xhr = new originalXHR();
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          store.dispatch(setUploadProgress(progress));
        }
      });
      return xhr;
    };

    // Cleanup after upload completes or fails
    const cleanup = () => {
      window.XMLHttpRequest = originalXHR;
    };

    // Add cleanup to both success and failure cases
    action.payload?.finally?.(cleanup);
  }

  return next(action);
};