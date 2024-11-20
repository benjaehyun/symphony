import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { X, UploadCloud } from 'lucide-react';
import { cn } from '../../utils/cn';
import { PhotoService } from '../../services/photo-service';
import { validatePhotoUpload } from '../../utils/validation/profile-validation';

const MAX_FILES = 6;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const PhotoUpload = ({ formData, onValidSubmit, onDataChange }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  
  const { setValue, watch } = useForm({
    defaultValues: formData,
    mode: 'onChange'
  });

  const photos = watch('photos') || [];

  const validateAndUpdatePhotos = async (newPhotos) => {
    const validationResult = await validatePhotoUpload({ photos: newPhotos });
    onDataChange({ photos: newPhotos }, validationResult.errors);
    setValue('photos', newPhotos);
    return validationResult.isValid;
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    // Validate number of files
    if (files.length + photos.length > MAX_FILES) {
      onDataChange(
        { photos }, 
        { photos: `You can only upload up to ${MAX_FILES} photos` }
      );
      return;
    }

    setUploading(true);
    
    try {
      const uploadPromises = files.map(async (file, index) => {
        try {
          const { url, key } = await PhotoService.uploadPhoto(
            file,
            (progress) => {
              setUploadProgress(prev => ({
                ...prev,
                [index]: progress
              }));
            }
          );

          return {
            url,
            key,
            order: photos.length + index
          };
        } catch (error) {
          console.error('Photo upload error:', error);
          return { error: error.message };
        }
      });

      const results = await Promise.all(uploadPromises);
      
      // Filter out errors and successful uploads
      const errors = results.filter(r => r.error);
      const successful = results.filter(r => !r.error);

      if (errors.length > 0) {
        onDataChange(
          { photos }, 
          { photos: `Some photos failed to upload: ${errors.map(e => e.error).join(', ')}` }
        );
      }

      if (successful.length > 0) {
        const newPhotos = [...photos, ...successful];
        await validateAndUpdatePhotos(newPhotos);
      }
    } catch (error) {
      onDataChange(
        { photos }, 
        { photos: 'Failed to upload photos. Please try again.' }
      );
    } finally {
      setUploading(false);
      setUploadProgress({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async (index) => {
    try {
      const newPhotos = [...photos];
      const removedPhoto = newPhotos.splice(index, 1)[0];
      
      await PhotoService.deletePhoto(removedPhoto.key);
      await validateAndUpdatePhotos(newPhotos);
    } catch (error) {
      onDataChange(
        { photos }, 
        { photos: 'Failed to delete photo. Please try again.' }
      );
    }
  };

  const handleReorderPhotos = async (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const newPhotos = [...photos];
    const [draggedPhoto] = newPhotos.splice(source.index, 1);
    newPhotos.splice(destination.index, 0, draggedPhoto);
    
    // Update order property
    const reorderedPhotos = newPhotos.map((photo, index) => ({
      ...photo,
      order: index
    }));

    await validateAndUpdatePhotos(reorderedPhotos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationResult = await validatePhotoUpload({ photos });
    if (validationResult.isValid) {
      onValidSubmit({ photos });
    } else {
      onDataChange({ photos }, validationResult.errors);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Add Your Photos</h2>
        <p className="text-muted-foreground">
          Add up to 6 photos to your profile. First photo will be your main profile picture.
          Drag to reorder photos.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <DragDropContext onDragEnd={handleReorderPhotos}>
          <Droppable droppableId="photos" direction="horizontal">
            {(provided) => (
              <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-2 md:grid-cols-3 gap-4"
              >
                {photos.map((photo, index) => (
                  <Draggable 
                    key={photo.key} 
                    draggableId={photo.key} 
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={cn(
                          "relative aspect-square rounded-md overflow-hidden group",
                          snapshot.isDragging && "ring-2 ring-primary shadow-lg"
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
                            onClick={() => handleRemovePhoto(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          {index === 0 && (
                            <span className="absolute bottom-2 left-2 text-xs text-white bg-black/60 px-2 py-1 rounded">
                              Main Photo
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}

                {/* Upload Button */}
                {photos.length < MAX_FILES && (
                  <div className="aspect-square rounded-md border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      multiple
                      accept={ACCEPTED_TYPES.join(',')}
                      onChange={handleFileSelect}
                      disabled={uploading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-full w-full flex flex-col gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <UploadCloud className="h-8 w-8" />
                      <span>Upload Photo</span>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Upload Progress */}
        {uploading && Object.keys(uploadProgress).length > 0 && (
          <div className="space-y-2 mt-4">
            {Object.entries(uploadProgress).map(([index, progress]) => (
              <div key={index} className="w-full bg-background-elevated rounded-full h-2">
                <div
                  className="bg-spotify-green h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Hidden submit button for form handling */}
        <button type="submit" className="hidden" />
      </form>

      <div className="text-sm text-muted-foreground">
        <p>Supported formats: JPG, PNG, WebP</p>
        <p>Maximum file size: 5MB</p>
      </div>
    </div>
  );
};

export default PhotoUpload;