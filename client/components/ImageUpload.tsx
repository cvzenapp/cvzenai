import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  X,
  Plus,
  Move3D,
  Eye,
} from "lucide-react";

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  maxSizeInMB?: number;
  acceptedTypes?: string[];
  className?: string;
  multiple?: boolean;
}

interface UploadingImage {
  id: string;
  file: File;
  progress: number;
  preview: string;
  error?: string;
}

export default function ImageUpload({
  images = [],
  onChange,
  maxImages = 5,
  maxSizeInMB = 10,
  acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"],
  className = "",
  multiple = true,
}: ImageUploadProps) {
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type not supported. Accepted types: ${acceptedTypes.map(type => type.split('/')[1]).join(", ")}`;
    }

    // Allow larger original files since we'll compress them
    const maxOriginalSize = maxSizeInMB * 2; // Allow 2x the target size for original files
    if (file.size > maxOriginalSize * 1024 * 1024) {
      return `File size too large. Maximum size: ${maxOriginalSize}MB (will be compressed)`;
    }

    if (images.length + uploadingImages.length >= maxImages) {
      return `Maximum ${maxImages} images allowed`;
    }

    return null;
  }, [acceptedTypes, maxSizeInMB, maxImages, images.length, uploadingImages.length]);

  const compressImage = useCallback(
    (file: File, maxWidth: number = 1200, maxHeight: number = 800, quality: number = 0.8): Promise<string> => {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
          // Calculate new dimensions
          let { width, height } = img;
          
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with compression
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  const result = e.target?.result;
                  if (typeof result === 'string') {
                    resolve(result);
                  } else {
                    reject(new Error('Failed to compress image'));
                  }
                };
                reader.onerror = () => reject(new Error('Failed to read compressed image'));
                reader.readAsDataURL(blob);
              } else {
                reject(new Error('Failed to create compressed blob'));
              }
            },
            file.type,
            quality
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
      });
    },
    []
  );

  const processImageUpload = useCallback(
    (uploadingImage: UploadingImage): Promise<string> => {
      return new Promise(async (resolve, reject) => {
        try {
          // Update progress to show compression starting
          setUploadingImages((prev) =>
            prev.map((img) =>
              img.id === uploadingImage.id ? { ...img, progress: 25 } : img,
            ),
          );

          // Compress the image
          const compressedDataUrl = await compressImage(uploadingImage.file);
          
          // Update progress to show compression complete
          setUploadingImages((prev) =>
            prev.map((img) =>
              img.id === uploadingImage.id ? { ...img, progress: 75 } : img,
            ),
          );

          resolve(compressedDataUrl);
        } catch (error) {
          reject(error);
        }
      });
    },
    [compressImage],
  );

  const handleFileSelect = useCallback(
    async (files: FileList) => {
      if (!files || files.length === 0) return;

      const validFiles: File[] = [];
      const errors: string[] = [];

      // Check each file
      Array.from(files).forEach((file) => {
        const error = validateFile(file);
        if (error) {
          errors.push(`${file.name}: ${error}`);
        } else {
          validFiles.push(file);
        }
      });

      // Show errors if any
      if (errors.length > 0) {
        console.error("File validation errors:", errors);
        // Create a more user-friendly error notification
        const errorMessage = errors.length === 1 
          ? errors[0] 
          : `${errors.length} files had validation issues`;
        
        // You could replace this with a toast notification in a real app
        alert(`❌ Upload Error\n\n${errorMessage}\n\nPlease check file types and sizes.`);
      }

      if (validFiles.length === 0) return;

      // Create uploading image entries with proper IDs
      const newUploadingImages: UploadingImage[] = validFiles.map((file, index) => ({
        id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        progress: 0,
        preview: URL.createObjectURL(file),
      }));

      setUploadingImages((prev) => [...prev, ...newUploadingImages]);

      // Process uploads sequentially to avoid race conditions
      const processedImages: string[] = [];
      
      for (const uploadingImage of newUploadingImages) {
        try {
          // Set initial progress
          setUploadingImages((prev) =>
            prev.map((img) =>
              img.id === uploadingImage.id ? { ...img, progress: 10 } : img,
            ),
          );

          const uploadedUrl = await processImageUpload(uploadingImage);
          processedImages.push(uploadedUrl);

          // Update progress to 100%
          setUploadingImages((prev) =>
            prev.map((img) =>
              img.id === uploadingImage.id ? { ...img, progress: 100 } : img,
            ),
          );

          // Clean up preview URL
          URL.revokeObjectURL(uploadingImage.preview);
        } catch (error) {
          console.error("Upload failed for file:", uploadingImage.file.name, error);
          setUploadingImages((prev) =>
            prev.map((img) =>
              img.id === uploadingImage.id
                ? { ...img, error: "Upload failed", progress: 0 }
                : img,
            ),
          );
        }
      }

      // Update images array with all successfully processed images
      if (processedImages.length > 0) {
        const updatedImages = [...images, ...processedImages];
        onChange(updatedImages);
      }

      // Remove all uploading images (both successful and failed)
      setTimeout(() => {
        setUploadingImages((prev) =>
          prev.filter((img) => !newUploadingImages.some((newImg) => newImg.id === img.id))
        );
      }, 1000); // Give user time to see the completion
    },
    [images, onChange, processImageUpload, validateFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files);
      }
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragOver to false if we're leaving the drop zone itself
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOver(false);
    }
  }, []);

  const removeImage = useCallback(
    (index: number) => {
      const newImages = images.filter((_, i) => i !== index);
      onChange(newImages);
    },
    [images, onChange],
  );

  const removeUploadingImage = useCallback((id: string) => {
    setUploadingImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  const moveImage = useCallback(
    (fromIndex: number, toIndex: number) => {
      const newImages = [...images];
      const [movedImage] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedImage);
      onChange(newImages);
    },
    [images, onChange],
  );

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const canAddMore = images.length + uploadingImages.length < maxImages;

  return (
    <div className={`space-y-4 ${className}`}>
      <Label className="text-base font-medium">Project Images</Label>

      {/* Upload Area */}
      {canAddMore && (
        <div
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
            ${
              dragOver
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 hover:border-slate-400"
            }
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={acceptedTypes.join(",")}
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
            className="hidden"
          />

          <div className="space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Upload Images
              </h3>
              <p className="text-slate-600 mb-4">
                Drag and drop images here, or click to browse
              </p>
              <Button onClick={openFileDialog} className="mb-2">
                <Plus className="w-4 h-4 mr-2" />
                Choose Images
              </Button>
              <p className="text-xs text-slate-500">
                Supports:{" "}
                {acceptedTypes.map((type) => type.split("/")[1]).join(", ")} •{" "}
                Max {maxSizeInMB}MB each • Up to {maxImages} images
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Uploading Images */}
      {uploadingImages.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-slate-900">Uploading...</h4>
          {uploadingImages.map((uploadingImage) => (
            <Card key={uploadingImage.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={uploadingImage.preview}
                      alt="Uploading"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">
                        {uploadingImage.file.name}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUploadingImage(uploadingImage.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    {uploadingImage.error ? (
                      <p className="text-sm text-red-600">
                        {uploadingImage.error}
                      </p>
                    ) : (
                      <div className="space-y-1">
                        <Progress
                          value={uploadingImage.progress}
                          className="h-2"
                        />
                        <p className="text-xs text-slate-500">
                          {Math.round(uploadingImage.progress)}% uploaded
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Uploaded Images Grid */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-900">
              Uploaded Images ({images.length})
            </h4>
            {images.length > 1 && (
              <p className="text-xs text-slate-500">
                Drag to reorder • First image will be the cover
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((imageUrl, index) => (
              <Card
                key={index}
                className="group relative overflow-hidden hover:shadow-lg transition-all duration-200"
              >
                <div className="aspect-video bg-slate-100">
                  <img
                    src={imageUrl}
                    alt={`Project image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='14'%3EImage not found%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </div>

                {/* Image Controls Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/90 hover:bg-white"
                      onClick={() => window.open(imageUrl, "_blank")}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/90 hover:bg-white text-red-600 hover:text-red-700"
                      onClick={() => removeImage(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Cover Image Badge */}
                {index === 0 && images.length > 1 && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Cover
                    </span>
                  </div>
                )}

                {/* Image Position */}
                <div className="absolute top-2 right-2">
                  <span className="bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                    {index + 1}
                  </span>
                </div>

                {/* Drag Handle */}
                {images.length > 1 && (
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/90 hover:bg-white cursor-move"
                      onMouseDown={(e) => {
                        // Simple reordering - move to front on click for now
                        e.preventDefault();
                        if (index !== 0) {
                          moveImage(index, 0);
                        }
                      }}
                    >
                      <Move3D className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upload Stats */}
      {(images.length > 0 || uploadingImages.length > 0) && (
        <div className="flex items-center justify-between text-sm text-slate-500 pt-2 border-t">
          <span>
            {images.length} uploaded
            {uploadingImages.length > 0 &&
              `, ${uploadingImages.length} uploading`}
          </span>
          <span>{maxImages - images.length} remaining</span>
        </div>
      )}
    </div>
  );
}
