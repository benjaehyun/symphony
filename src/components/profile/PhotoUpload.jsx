import { useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { X, UploadCloud } from 'lucide-react';  
import { cn } from '../../utils/cn';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { PhotoService } from '../../services/photo-service';  

const MAX_FILES = 6;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const PhotoUpload = ({ photos, onChange, errors }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    // Validate number of files
    if (files.length + photos.length > MAX_FILES) {
      onChange({ 
        error: `You can only upload up to ${MAX_FILES} photos` 
      });
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
          return { error: error.message };
        }
      });

      const results = await Promise.all(uploadPromises);
      
      // Filter out errors and successful uploads
      const errors = results.filter(r => r.error);
      const successful = results.filter(r => !r.error);

      if (errors.length > 0) {
        onChange({ 
          error: `Some photos failed to upload: ${errors.map(e => e.error).join(', ')}` 
        });
      }

      if (successful.length > 0) {
        onChange({
          photos: [...photos, ...successful]
        });
      }
    } catch (error) {
      onChange({ error: 'Failed to upload photos. Please try again.' });
    } finally {
      setUploading(false);
      setUploadProgress({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async (index) => {
    const newPhotos = [...photos];
    const removedPhoto = newPhotos.splice(index, 1)[0];
    
    try {
      await PhotoService.deletePhoto(removedPhoto.key);
      onChange({ photos: newPhotos });
    } catch (error) {
      onChange({ 
        error: 'Failed to delete photo. Please try again.',
        photos: [...photos] // Restore original photos
      });
    }
  };

  const handleReorderPhotos = (result) => {
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

    onChange({ photos: reorderedPhotos });
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

      {/* Photo Grid with Drag and Drop */}
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

      {/* Error Display */}
      {errors?.photos && (
        <Alert variant="destructive">
          <AlertDescription>{errors.photos}</AlertDescription>
        </Alert>
      )}

      {/* Upload Progress */}
      {uploading && Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
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

      <div className="text-sm text-muted-foreground">
        <p>Supported formats: JPG, PNG, WebP</p>
        <p>Maximum file size: 5MB</p>
      </div>
    </div>
  );
};

export default PhotoUpload;