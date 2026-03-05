import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FileUpload } from '@/components/ui/file-upload';
import { FileUploadResult } from '@/services/fileUploadService';
import { Upload, CheckCircle, FileText, Settings, Zap } from 'lucide-react';
import ResumeParsingAnalysis from './ResumeParsingAnalysis';

interface ResumeImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (resumeId: string) => void;
}

export default function ResumeImportModal({ open, onClose, onSuccess }: ResumeImportModalProps) {
  const navigate = useNavigate();
  const [uploadResult, setUploadResult] = useState<FileUploadResult | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleFileUpload = (result: FileUploadResult) => {
    console.log('📥 Resume upload result:', result);
    
    // Show scanning animation
    setIsScanning(true);
    
    // Simulate scanning delay for better UX
    setTimeout(() => {
      setUploadResult(result);
      setIsScanning(false);

      if (result.success && result.resumeId && result.parsedData) {
        // Show analysis after scanning
        setShowAnalysis(true);
      }
    }, 2500); // 2.5 second scanning animation
  };

  const handleContinueToBuilder = () => {
    if (uploadResult?.resumeId) {
      if (onSuccess) {
        onSuccess(uploadResult.resumeId);
      } else {
        onClose();
        navigate(`/builder?edit=true&id=${uploadResult.resumeId}`);
      }
    }
  };

  const handlePreviewResume = () => {
    if (uploadResult?.resumeId) {
      onClose();
      navigate(`/resume/${uploadResult.resumeId}`);
    }
  };

  const handleClose = () => {
    setUploadResult(null);
    setShowAnalysis(false);
    setIsScanning(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {isScanning ? 'Scanning Resume' : showAnalysis ? 'Resume Analysis' : 'Import Resume'}
          </DialogTitle>
          <DialogDescription>
            {isScanning 
              ? 'Our AI is analyzing your resume structure and extracting key information...'
              : showAnalysis 
                ? 'Review what was extracted from your resume'
                : 'Upload your existing resume and we\'ll automatically extract the information using AI.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isScanning ? (
            <>
              {/* Process Flow */}
              <div className="relative py-3 border-y border-blue-200">
                <div className="flex items-center justify-between px-4">
                  {/* Step 1: Upload Resume */}
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mb-1 border border-green-300">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-xs text-slate-600">Uploaded</p>
                  </div>

                  {/* Progress line 1 with scanning animation */}
                  <div className="flex-1 mx-2 relative">
                    <div className="h-0.5 bg-blue-300 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-400 to-transparent bg-[length:200%_100%] animate-shimmer"></div>
                    </div>
                    {/* Scanning icon animation */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                      <div className="h-6 w-6 rounded-full bg-white flex items-center justify-center animate-pulse shadow-sm">
                        <Settings className="h-3 w-3 text-blue-500 animate-spin" />
                      </div>
                    </div>
                  </div>

                  {/* Step 2: AI Analysis */}
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mb-1 border border-blue-300">
                      <Zap className="h-4 w-4 text-blue-500" />
                    </div>
                    <p className="text-xs text-slate-600">AI Analysis</p>
                  </div>

                  {/* Progress line 2 with resume icon */}
                  <div className="flex-1 mx-2 relative">
                    <div className="h-0.5 bg-blue-300 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-400 to-transparent bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: '0.5s' }}></div>
                    </div>
                    {/* Resume shimmering icon */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                      <div className="h-6 w-6 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <FileText className="h-3 w-3 text-blue-500 animate-pulse" />
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Ready */}
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center mb-1 border border-slate-300">
                      <CheckCircle className="h-4 w-4 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-600">Ready</p>
                  </div>
                </div>
              </div>

              {/* Document Scanning Animation */}
              <div className="py-8 text-center space-y-6">
                <div className="relative mx-auto w-32 h-40">
                  {/* Document Background */}
                  <div className="absolute inset-0 bg-white border-2 border-slate-200 rounded-lg shadow-lg">
                    {/* Document Lines */}
                    <div className="p-4 space-y-2">
                      <div className="h-2 bg-slate-100 rounded"></div>
                      <div className="h-2 bg-slate-100 rounded w-4/5"></div>
                      <div className="h-2 bg-slate-100 rounded w-3/4"></div>
                      <div className="h-2 bg-slate-100 rounded w-5/6"></div>
                      <div className="h-2 bg-slate-100 rounded w-2/3"></div>
                      <div className="h-2 bg-slate-100 rounded w-4/5"></div>
                      <div className="h-2 bg-slate-100 rounded w-3/4"></div>
                      <div className="h-2 bg-slate-100 rounded w-5/6"></div>
                    </div>
                  </div>
                  
                  {/* Scanning Line with Shimmer Effect */}
                  <div className="absolute inset-0 overflow-hidden rounded-lg">
                    <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-80 animate-scan-down"></div>
                  </div>
                  
                  {/* Scanning Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent rounded-lg animate-pulse"></div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900">Analyzing Your Resume</h3>
                  <p className="text-sm text-slate-600 max-w-sm mx-auto">
                    Extracting personal information, skills, experience, and education details...
                  </p>
                </div>

                {/* Progress Shimmer Bar */}
                <div className="w-48 mx-auto">
                  <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 bg-[length:200%_100%] animate-shimmer rounded-full"></div>
                  </div>
                </div>
              </div>
            </>
          ) : !showAnalysis ? (
            <>
              <FileUpload
                onFileUpload={handleFileUpload}
                accept=".pdf,.doc,.docx"
                showPreview={true}
              />

              {uploadResult?.success && uploadResult.resumeId && !uploadResult.parsedData && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Resume imported successfully!</p>
                      <p className="text-sm">Redirecting to editor...</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            uploadResult?.parsedData && uploadResult?.resumeId && (
              <ResumeParsingAnalysis
                parsedData={uploadResult.parsedData}
                resumeId={uploadResult.resumeId}
                onContinue={handleContinueToBuilder}
                onPreview={handlePreviewResume}
                onCancel={handleClose}
              />
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
