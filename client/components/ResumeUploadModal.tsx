import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fileUrl?: string) => void;
  jobTitle: string;
}

export default function ResumeUploadModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  jobTitle 
}: ResumeUploadModalProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, DOC, or DOCX file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // CRITICAL: Validate authentication token before upload
    const authToken = localStorage.getItem('authToken');
    console.log('🔐 ResumeUploadModal - Auth check before upload:', {
      hasToken: !!authToken,
      tokenValue: authToken,
      tokenType: typeof authToken,
      tokenLength: authToken?.length,
      isNullString: authToken === 'null',
      isUndefinedString: authToken === 'undefined',
      isEmpty: authToken === '',
      looksLikeJWT: authToken?.includes('.') && authToken?.split('.').length === 3
    });

    // Check for invalid tokens
    if (!authToken || 
        authToken === 'null' || 
        authToken === 'undefined' || 
        authToken === '' ||
        authToken.length < 20) {
      
      console.error('❌ Invalid auth token detected:', {
        token: authToken,
        reason: !authToken ? 'missing' : 
                authToken === 'null' ? 'string_null' :
                authToken === 'undefined' ? 'string_undefined' :
                authToken === '' ? 'empty' :
                'too_short'
      });
      
      // Clear invalid tokens
      console.log('🧹 Clearing invalid token from localStorage');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      setError('Your session has expired. Please log in again to upload a resume.');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      
      return;
    }

    setError(null);
    setUploading(true);

    try {
      console.log('📤 Starting file upload with token:', authToken.substring(0, 20) + '...');
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Upload to server
      const response = await fetch('/api/upload/resume', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      console.log('📥 Upload response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Upload failed:', errorData);
        
        // If 401, token is invalid - clear and redirect
        if (response.status === 401) {
          console.log('🧹 Got 401, clearing auth and redirecting to login');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setError('Your session has expired. Redirecting to login...');
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
          return;
        }
        
        throw new Error(errorData.error || 'Failed to upload file');
      }

      const data = await response.json();
      console.log('✅ Upload successful:', data);
      setUploadedFileUrl(data.url);
      setFileName(file.name);
      
      // Verify token is still present after upload
      const tokenAfterUpload = localStorage.getItem('authToken');
      console.log('🔐 Token after upload:', {
        hasToken: !!tokenAfterUpload,
        tokenPrefix: tokenAfterUpload?.substring(0, 20) + '...',
        tokenChanged: tokenAfterUpload !== authToken
      });
      
      if (!tokenAfterUpload || tokenAfterUpload !== authToken) {
        console.error('⚠️ WARNING: Token was modified during upload!', {
          before: authToken?.substring(0, 20) + '...',
          after: tokenAfterUpload?.substring(0, 20) + '...'
        });
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    onSubmit(uploadedFileUrl || undefined);
  };

  const handleSkip = () => {
    onSubmit(undefined);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10001] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Upload CV</h2>
                <p className="text-blue-100 text-sm mt-1">
                  For: {jobTitle}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-slate-700 mb-4">
                You can upload a resume file (PDF, DOC, DOCX) or use your existing CVZen resume.
              </p>

              {/* Upload Area */}
              <div className="mb-6">
                <label
                  htmlFor="resume-upload"
                  className={`
                    block border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                    transition-all
                    ${uploadedFileUrl 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50'
                    }
                    ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <input
                    id="resume-upload"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="hidden"
                  />
                  
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
                      <p className="text-slate-600">Uploading...</p>
                    </div>
                  ) : uploadedFileUrl ? (
                    <div className="flex flex-col items-center">
                      <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
                      <p className="text-green-700 font-semibold">{fileName}</p>
                      <p className="text-sm text-slate-600 mt-1">File uploaded successfully</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="h-12 w-12 text-slate-400 mb-3" />
                      <p className="text-slate-700 font-semibold mb-1">
                        Click to upload cv
                      </p>
                      <p className="text-sm text-slate-500">
                        PDF, DOC, or DOCX (max 5MB)
                      </p>
                    </div>
                  )}
                </label>

                {error && (
                  <div className="mt-3 flex items-start gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">Using CVZen Resume</p>
                    <p>If you don't upload a file, we'll use your active CVZen resume for this application.</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSubmit}
                  className="flex-1"
                  disabled={uploading}
                >
                  {uploadedFileUrl ? 'Apply with Uploaded Resume' : 'Apply with CVZen Resume'}
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
