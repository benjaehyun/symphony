import { useRef, useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { ImagePlus, X, UploadCloud, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import ImageCropper from '../ui/image-cropper';
import PhotoService from '../../services/photo-service';
import {
  uploadProfilePhotos,
  updatePhotoOrder,
  addStagedPhoto,
  removeStagedPhoto,
  updatePhotoOrderLocal,
  clearStagedPhotos,
  setUploadProgress,
  selectPhotoUploadState,
  selectAllPhotos,
  selectUploadStatus,
  selectUploadProgress,
  selectPhotoUploadError,
  PHOTO_UPLOAD_STATUS
} from '../../store/slices/profileSlice';

const MAX_FILES = 6;
const ASPECT_RATIO = 4/5;

const PhotoUpload = ({ onValidSubmit }) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [cropFile, setCropFile] = useState(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [localError, setLocalError] = useState(null);

  // Redux selectors
  const photos = useSelector(selectAllPhotos);
  const uploadStatus = useSelector(selectUploadStatus);
  const uploadProgress = useSelector(selectUploadProgress);
  const uploadError = useSelector(selectPhotoUploadError);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(clearStagedPhotos());
    };
  }, [dispatch]);

  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target?.files || e);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Check total number of files
    if (photos.length + files.length > MAX_FILES) {
      setLocalError(`You can only upload up to ${MAX_FILES} photos`);
      return;
    }

    setLocalError(null);

    for (const file of files) {
      try {
        // Check if file needs cropping
        const dimensions = await PhotoService.getImageDimensions(file);
        const currentRatio = dimensions.width / dimensions.height;
        const needsCropping = Math.abs(currentRatio - ASPECT_RATIO) > 0.01;

        if (needsCropping) {
          setCropFile(file);
        } else {
          const stagedPhoto = await PhotoService.preparePhotoForUpload(file);
          dispatch(addStagedPhoto(stagedPhoto));
        }
      } catch (error) {
        console.error('Error processing file:', error);
        setLocalError(error.message || 'Error processing file');
      }
    }
  }, [dispatch, photos.length]);

  const handleCropComplete = useCallback(async (croppedFile) => {
    try {
      const stagedPhoto = await PhotoService.preparePhotoForUpload(croppedFile);
      dispatch(addStagedPhoto(stagedPhoto));
    } catch (error) {
      setLocalError(error.message || 'Error processing cropped image');
    } finally {
      setCropFile(null);
    }
  }, [dispatch]);

  const handleRemovePhoto = useCallback((photoId) => {
    dispatch(removeStagedPhoto(photoId));
  }, [dispatch]);

  const handleReorderPhotos = useCallback(({ source, destination }) => {
    if (!destination || source.index === destination.index) return;

    const newPhotoOrder = Array.from(photos).map(p => p.id);
    const [moved] = newPhotoOrder.splice(source.index, 1);
    newPhotoOrder.splice(destination.index, 0, moved);

    dispatch(updatePhotoOrderLocal(newPhotoOrder));

    // If all photos are saved (no staged photos), update on server
    if (!photos.some(photo => PhotoService.isStaged(photo.id))) {
      dispatch(updatePhotoOrder(newPhotoOrder));
    }
  }, [dispatch, photos]);

  const handleSaveChanges = async () => {
    if (uploadStatus === PHOTO_UPLOAD_STATUS.LOADING) return;
  
    const stagedPhotos = photos.filter(photo => PhotoService.isStaged(photo.id));
    if (!stagedPhotos.length) {
      setLocalError('No new photos to upload');
      return;
    }
  
    try {
      const formData = new FormData();
      
      // Add each photo with a unique field name
      stagedPhotos.forEach((photo, index) => {
        if (photo.file instanceof File) {
          console.log('Appending file:', photo.file.name, photo.file.type);
          formData.append(`photos`, photo.file); // Keep the field name as 'photos'
        }
      });
  
      // Add photo order separately
      const photoOrder = photos.map(p => p.id);
      formData.append('photoOrder', JSON.stringify(photoOrder));
  
      // Log the FormData entries
      for (let [key, value] of formData.entries()) {
        console.log(`FormData Entry - ${key}:`, value instanceof File ? `File: ${value.name}` : value);
      }
  
      await dispatch(uploadProfilePhotos({ formData })).unwrap();
      if (onValidSubmit) {
        onValidSubmit({ photos });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setLocalError('Failed to save changes. Please try again.');
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileSelect(droppedFiles);
  }, [handleFileSelect]);

  const hasUnsavedChanges = photos.some(photo => PhotoService.isStaged(photo.id));
  const isLoading = uploadStatus === PHOTO_UPLOAD_STATUS.LOADING;

  return (
    <div 
      className="space-y-6"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Add Your Photos</h2>
        <p className="text-muted-foreground">
          Add up to {MAX_FILES} photos to your profile. The first photo will be your main profile picture.
          Drag and drop to reorder.
        </p>
      </div>

      <DragDropContext onDragEnd={handleReorderPhotos}>
        <Droppable droppableId="photos" direction="horizontal">
          {(provided, snapshot) => (
            <div 
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={cn(
                "grid grid-cols-2 md:grid-cols-3 gap-4",
                snapshot.isDraggingOver && "ring-2 ring-primary rounded-lg p-4",
                isDraggingOver && "ring-2 ring-primary-500/50"
              )}
            >
              {photos.map((photo, index) => (
                <Draggable 
                  key={photo.id} 
                  draggableId={photo.id} 
                  index={index}
                  isDragDisabled={isLoading}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={cn(
                        "relative aspect-[4/5] rounded-md overflow-hidden group",
                        snapshot.isDragging && "ring-2 ring-primary shadow-lg",
                        PhotoService.isStaged(photo.id) && "ring-1 ring-yellow-500"
                      )}
                    >
                      <img
                        src={photo.url}
                        alt={`Profile photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => handleRemovePhoto(photo.id)}
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        {index === 0 && (
                          <span className="absolute bottom-2 left-2 text-xs text-white bg-black/60 px-2 py-1 rounded">
                            Main Photo
                          </span>
                        )}
                        {PhotoService.isStaged(photo.id) && (
                          <span className="absolute bottom-2 right-2 text-xs text-yellow-400 bg-black/60 px-2 py-1 rounded">
                            Unsaved
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}

              {photos.length < MAX_FILES && (
                <div className="aspect-[4/5] rounded-md border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleFileSelect(e)}
                    disabled={isLoading}
                    multiple
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-full w-full flex flex-col gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <ImagePlus className="h-8 w-8" />
                    <span>Add Photos</span>
                    <span className="text-xs text-muted-foreground">
                      Drop files here or click to browse
                    </span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {isLoading && uploadProgress > 0 && (
        <div className="space-y-2">
          <Progress value={uploadProgress} />
          <p className="text-sm text-muted-foreground text-center">
            Uploading... {uploadProgress.toFixed(0)}%
          </p>
        </div>
      )}

      {hasUnsavedChanges && (
        <Button
          onClick={handleSaveChanges}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving Changes...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      )}

      {(localError || uploadError) && (
        <Alert variant="destructive">
          <AlertDescription>
            {localError || uploadError?.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="text-sm text-muted-foreground space-y-1">
        <p>• Supported formats: JPG, PNG, WebP</p>
        <p>• Maximum file size: 10MB per photo</p>
        <p>• Photos will be cropped to 4:5 ratio</p>
        <p>• Drag photos to reorder them</p>
        <p>• First photo will be your main profile picture</p>
      </div>

      {cropFile && (
        <ImageCropper
          file={cropFile}
          aspectRatio={ASPECT_RATIO}
          onComplete={handleCropComplete}
          onCancel={() => setCropFile(null)}
        />
      )}
    </div>
  );
};

export default PhotoUpload;