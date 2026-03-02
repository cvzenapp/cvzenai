export interface FileUploadResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  content?: string;
  url?: string;
  error?: string;
  parsed?: boolean;
  parsedData?: any; // Resume data parsed by Groq
  resumeId?: string; // ID of created resume in database
  message?: string;
}

export interface SupportedFileType {
  extension: string;
  mimeType: string;
  maxSize: number; // in bytes
  description: string;
}

class FileUploadService {
  // Supported file types for resume analysis
  private supportedTypes: SupportedFileType[] = [
    {
      extension: '.pdf',
      mimeType: 'application/pdf',
      maxSize: 5 * 1024 * 1024, // 5MB
      description: 'PDF Document'
    },
    {
      extension: '.doc',
      mimeType: 'application/msword',
      maxSize: 5 * 1024 * 1024, // 5MB
      description: 'Word Document'
    },
    {
      extension: '.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      maxSize: 5 * 1024 * 1024, // 5MB
      description: 'Word Document'
    },
    {
      extension: '.txt',
      mimeType: 'text/plain',
      maxSize: 1 * 1024 * 1024, // 1MB
      description: 'Text File'
    }
  ];

  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("authToken");
  }

  getSupportedTypes(): SupportedFileType[] {
    return this.supportedTypes;
  }

  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    const supportedType = this.supportedTypes.find(
      type => type.mimeType === file.type || file.name.toLowerCase().endsWith(type.extension)
    );

    if (!supportedType) {
      return {
        valid: false,
        error: `Unsupported file type. Supported formats: ${this.supportedTypes.map(t => t.extension).join(', ')}`
      };
    }

    if (file.size > supportedType.maxSize) {
      return {
        valid: false,
        error: `File size too large. Maximum size: ${this.formatFileSize(supportedType.maxSize)}`
      };
    }

    return { valid: true };
  }

  async uploadFile(file: File): Promise<FileUploadResult> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // CRITICAL: Capture token BEFORE making request
    // Don't re-fetch from localStorage after request fails
    const token = this.getToken();
    
    console.log('🔍 ALL localStorage keys BEFORE upload:', Object.keys(localStorage));
    console.log('🔍 authToken value BEFORE upload:', localStorage.getItem('authToken'));
    console.log('📤 File upload - Token captured:', {
      hasToken: !!token,
      tokenValue: token,
      tokenType: typeof token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'null',
      isNullString: token === 'null',
      isUndefinedString: token === 'undefined'
    });

    if (!token) {
      console.error('❌ No auth token found - user must log in');
      return {
        success: false,
        error: 'Please log in to upload files'
      };
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'resume');

      // Build headers - don't set Content-Type for FormData
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`
      };

      console.log('📤 Making file upload request with captured token');

      const response = await fetch('/api/upload/resume', {
        method: 'POST',
        headers,
        body: formData,
      });

      console.log('📥 File upload response:', {
        status: response.status,
        ok: response.ok
      });
      
      console.log('🔍 authToken value AFTER upload:', localStorage.getItem('authToken'));

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('❌ File upload failed:', {
          status: response.status,
          errorData
        });
        throw new Error(errorData?.error || `Upload failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ File upload successful:', result);
      return result;

    } catch (error) {
      console.error('❌ File upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        resolve(event.target?.result as string || '');
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      // For text files, read as text
      if (file.type === 'text/plain') {
        reader.readAsText(file);
      } else {
        // For other files, we'll need server-side processing
        resolve('');
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const fileUploadService = new FileUploadService();