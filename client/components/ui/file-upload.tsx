import React, { useRef, useState } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import { Paperclip, Upload, X, FileText, AlertCircle, CheckCircle, File } from 'lucide-react';
import { fileUploadService, FileUploadResult } from '../../services/fileUploadService';

interface FileUploadProps {
  onFileSelect?: (file: File) => void;
  onFileUpload?: (result: FileUploadResult) => void;
  onFileRemove?: () => void;
  disabled?: boolean;
  className?: string;
  accept?: string;
  maxSize?: number;
  showPreview?: boolean;
  uploadFunction?: (file: File) => Promise<FileUploadResult>; // Custom upload function
}

interface UploadedFile {
  file: File;
  result?: FileUploadResult;
  uploading?: boolean;
  error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onFileUpload,
  onFileRemove,
  disabled = false,
  className = '',
  accept = '.pdf,.doc,.docx,.txt',
  showPreview = true,
  uploadFunction // Custom upload function
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    const validation = fileUploadService.validateFile(file);
    
    if (!validation.valid) {
      setUploadedFile({
        file,
        error: validation.error
      });
      return;
    }

    setUploadedFile({
      file,
      uploading: true
    });

    if (onFileSelect) {
      onFileSelect(file);
    }

    // Auto-upload the file
    handleFileUpload(file);
  };

  const handleFileUpload = async (file: File) => {
    try {
      // Use custom upload function if provided, otherwise use default
      const result = uploadFunction 
        ? await uploadFunction(file)
        : await fileUploadService.uploadFile(file);
      
      setUploadedFile(prev => prev ? {
        ...prev,
        result,
        uploading: false,
        error: result.success ? undefined : result.error
      } : null);

      if (onFileUpload) {
        onFileUpload(result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadedFile(prev => prev ? {
        ...prev,
        uploading: false,
        error: errorMessage
      } : null);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onFileRemove) {
      onFileRemove();
    }
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-6 w-6 text-blue-500" />;
      case 'txt':
        return <File className="h-6 w-6 text-gray-500" />;
      default:
        return <Paperclip className="h-6 w-6 text-gray-400" />;
    }
  };

  const supportedTypes = fileUploadService.getSupportedTypes();

  return (
    <div className={`space-y-3 ${className}`}>
      {/* File Upload Area */}
      {!uploadedFile && (
        <Card 
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            dragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={!disabled ? openFileDialog : undefined}
        >
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-gray-100 rounded-full">
                <Upload className="h-8 w-8 text-gray-600" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Drop your resume here or click to browse
                </p>
                <p className="text-xs text-gray-500">
                  Supported formats: {supportedTypes.map(t => t.extension).join(', ')}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={disabled}
                onClick={(e) => {
                   e.stopPropagation();
                  openFileDialog();
                }}
              >
                <Paperclip className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Preview */}
      {uploadedFile && showPreview && (
        <Card className="border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getFileIcon(uploadedFile.file.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {fileUploadService.formatFileSize(uploadedFile.file.size)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Status Badge */}
                {uploadedFile.uploading && (
                  <Badge variant="secondary" className="text-xs">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                    Uploading...
                  </Badge>
                )}
                
                {uploadedFile.error && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Error
                  </Badge>
                )}
                
                {uploadedFile.result?.success && (
                  <Badge variant="default" className="text-xs bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Ready
                  </Badge>
                )}
                
                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Error Message */}
            {uploadedFile.error && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                {uploadedFile.error}
              </div>
            )}
            
            {/* Success Message */}
            {uploadedFile.result?.success && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                File uploaded successfully! Ready for AI analysis.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />
      
      {/* Supported Formats Info */}
      {!uploadedFile && (
        <div className="text-xs text-gray-500 space-y-1">
          <p className="font-medium">Supported formats:</p>
          {supportedTypes.map((type, index) => (
            <div key={index} className="flex justify-between">
              <span>{type.extension.toUpperCase()} - {type.description}</span>
              <span>Max {fileUploadService.formatFileSize(type.maxSize)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;