import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, X, User, Camera } from "lucide-react";

interface ProfilePictureUploadProps {
  value: string;
  onChange: (url: string) => void;
  maxSizeInMB?: number;
  className?: string;
}

export default function ProfilePictureUpload({
  value,
  onChange,
  maxSizeInMB = 5,
  className = "",
}: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type not supported. Accepted types: JPG, PNG, WebP`;
    }

    if (file.size > maxSizeInMB * 1024 * 1024) {
      return `File size too large. Maximum size: ${maxSizeInMB}MB`;
    }

    return null;
  };

  const simulateUpload = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      let progress = 0;
      setUploading(true);
      setUploadProgress(0);

      const interval = setInterval(() => {
        progress += Math.random() * 25;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          // Simulate successful upload and return a URL
          // In production, this would upload to a cloud service
          const mockUrl = `https://images.unsplash.com/photo-${Date.now()}?w=400&h=400&fit=crop&crop=face`;
          setUploading(false);
          resolve(mockUrl);
        }
        setUploadProgress(progress);
      }, 100);
    });
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
      const error = validateFile(file);
      if (error) {
        alert(error);
        return;
      }

      try {
        const uploadedUrl = await simulateUpload(file);
        onChange(uploadedUrl);
      } catch (error) {
        alert("Upload failed. Please try again.");
        setUploading(false);
      }
    },
    [onChange, simulateUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    onChange("");
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Label>Profile Picture</Label>

      <div className="flex items-center gap-6">
        {/* Profile Picture Preview */}
        <div
          className={`
            relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg transition-all duration-200 group
            ${dragOver ? "border-blue-500 shadow-blue-200" : ""}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {value ? (
            <>
              <img
                src={value}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='12'%3EImage not found%3C/text%3E%3C/svg%3E";
                }}
              />
              {/* Overlay for existing image */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/90 hover:bg-white"
                  onClick={openFileDialog}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <div
              className={`
                w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center cursor-pointer transition-all duration-200
                ${dragOver ? "from-blue-100 to-blue-200" : "hover:from-slate-200 hover:to-slate-300"}
              `}
              onClick={openFileDialog}
            >
              {uploading ? (
                <div className="text-center space-y-2">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-600">
                    {Math.round(uploadProgress)}%
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500">Add Photo</p>
                </div>
              )}
            </div>
          )}

          {/* Upload Progress Ring */}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20">
                <svg
                  className="w-full h-full transform -rotate-90"
                  viewBox="0 0 32 32"
                >
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    fill="none"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeDasharray={`${(uploadProgress / 100) * 88} 88`}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(",")}
            onChange={(e) =>
              e.target.files && handleFileSelect(e.target.files[0])
            }
            className="hidden"
            disabled={uploading}
          />

          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openFileDialog}
              disabled={uploading}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {value ? "Change Photo" : "Upload Photo"}
            </Button>

            {value && !uploading && (
              <Button
                variant="outline"
                size="sm"
                onClick={removeImage}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-2" />
                Remove Photo
              </Button>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-500">Supports: JPG, PNG, WebP</p>
            <p className="text-xs text-slate-500">Max size: {maxSizeInMB}MB</p>
            <p className="text-xs text-slate-500">
              Recommended: Square image, 400x400px
            </p>
          </div>
        </div>
      </div>

      {/* Drag & Drop Hint */}
      {!value && !uploading && (
        <div className="text-center p-4 border-2 border-dashed border-slate-200 rounded-lg">
          <p className="text-sm text-slate-500">
            Drag and drop an image here, or click "Upload Photo"
          </p>
        </div>
      )}
    </div>
  );
}
