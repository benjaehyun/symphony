import { useState, useRef, useEffect } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import 'react-image-crop/dist/ReactCrop.css';

const ImageCropper = ({ 
  file, 
  onComplete, 
  onCancel, 
  aspectRatio = 4/5,
  minDimension = 400,
  maxFileSize = 10 * 1024 * 1024 // 10MB
}) => {
  const [crop, setCrop] = useState();
  const [imageSrc, setImageSrc] = useState(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const imageRef = useRef(null);

  useEffect(() => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate initial crop size maintaining 4:5 ratio
        let cropWidth = img.width * 0.9; // Start with 90% width
        let cropHeight = cropWidth * (5/4); // Force 4:5 ratio

        // If height is too large, scale down from height instead
        if (cropHeight > img.height * 0.9) {
          cropHeight = img.height * 0.9;
          cropWidth = cropHeight * (4/5);
        }

        const initialCrop = centerCrop(
          makeAspectCrop(
            {
              unit: '%',
              width: (cropWidth / img.width) * 100,
              height: (cropHeight / img.height) * 100,
            },
            4/5,
            img.width,
            img.height
          ),
          img.width,
          img.height
        );
        
        setCrop(initialCrop);
        setImageSrc(e.target.result);
      };
      img.onerror = () => {
        setError('Failed to load image');
        onCancel();
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      setError('Failed to read file');
      onCancel();
    };
    reader.readAsDataURL(file);

    return () => {
      reader.abort();
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [file, onCancel]);

  const handleComplete = async () => {
    if (!imageRef.current || !crop) {
      setError('Please make a crop selection');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const image = imageRef.current;

      // Calculate dimensions
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const pixelCrop = {
        x: crop.x * scaleX,
        y: crop.y * scaleY,
        width: crop.width * scaleX,
        height: crop.height * scaleY,
      };

      // Ensure minimum dimensions
      if (pixelCrop.width < minDimension || pixelCrop.height < minDimension) {
        throw new Error(`Image must be at least ${minDimension}x${minDimension} pixels`);
      }

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      // Draw the cropped image
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Try different quality settings to meet file size requirement
      let quality = 0.9;
      let blob = null;
      
      while (quality >= 0.3) { // Don't go below 0.3 quality
        blob = await new Promise(resolve => {
          canvas.toBlob(resolve, 'image/jpeg', quality);
        });
        
        if (blob.size <= maxFileSize) break;
        quality -= 0.1;
      }

      if (!blob || blob.size > maxFileSize) {
        throw new Error('Unable to create an image under 10MB while maintaining quality');
      }

      const croppedFile = new File(
        [blob],
        `cropped-${file.name}`,
        { type: 'image/jpeg', lastModified: Date.now() }
      );

      await onComplete(croppedFile);
    } catch (err) {
      console.error('Error cropping image:', err);
      setError(err.message || 'Failed to process the image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDialogClose = () => {
    if (!isProcessing) {
      onCancel();
    }
  };

  return (
    <Dialog open onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-3xl w-[95vw] p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-2xl">Crop Your Photo</DialogTitle>
          <DialogDescription className="text-sm md:text-base">
            Adjust your photo to fit the 4:5 ratio required for profiles.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <div className="relative overflow-hidden rounded-lg touch-none">
            {imageSrc && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCrop(c)}
                aspect={4/5}
                minWidth={(minDimension / imageRef.current?.width) * 100}
                minHeight={(minDimension / imageRef.current?.height) * 100}
                ruleOfThirds
                className={cn(
                  "max-h-[70vh] md:max-h-[60vh]",
                  isProcessing && "opacity-50 pointer-events-none"
                )}
                renderSelectionAddon={() => (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs md:text-sm p-1 text-center">
                      Drag to adjust • Pinch to zoom
                    </div>
                  </div>
                )}
                style={{ touchAction: 'none' }}
              >
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Crop preview"
                  className="max-w-full h-auto"
                  style={{ 
                    maxHeight: '70vh',
                    touchAction: 'none',
                    WebkitUserSelect: 'none',
                    userSelect: 'none'
                  }}
                  onTouchStart={(e) => setTouchStart(e.touches[0])}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    setTouchEnd(e.touches[0]);
                  }}
                  onTouchEnd={() => {
                    setTouchStart(null);
                    setTouchEnd(null);
                  }}
                />
              </ReactCrop>
            )}
          </div>

          {/* {crop && imageRef.current && (
            <p className="text-xs md:text-sm text-muted-foreground text-center">
              Selected size: {Math.round(crop.width * imageRef.current.width / 100)}
              x{Math.round(crop.height * imageRef.current.height / 100)} pixels
            </p>
          )} */}

          <div className="flex justify-between gap-2 mt-4">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 text-sm md:text-base py-2 md:py-3"
            >
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              disabled={!crop || isProcessing || error}
              className="flex-1 text-sm md:text-base py-2 md:py-3"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="whitespace-nowrap">Processing...</span>
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>

          <div className="mt-4 text-xs md:text-sm text-muted-foreground">
            <ul className="space-y-1">
              <li>• Drag the corners to adjust crop area</li>
              <li>• Pinch to zoom in/out</li>
              <li>• Image will maintain 4:5 ratio</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropper;