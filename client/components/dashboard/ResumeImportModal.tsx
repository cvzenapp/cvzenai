import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FileUpload } from '@/components/ui/file-upload';
import { FileUploadResult } from '@/services/fileUploadService';
import { Upload, CheckCircle } from 'lucide-react';
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

  const handleFileUpload = (result: FileUploadResult) => {
    console.log('📥 Resume upload result:', result);
    setUploadResult(result);

    if (result.success && result.resumeId && result.parsedData) {
      // Show analysis instead of immediately redirecting
      setShowAnalysis(true);
    }
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
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {showAnalysis ? 'Resume Analysis' : 'Import Resume'}
          </DialogTitle>
          <DialogDescription>
            {showAnalysis 
              ? 'Review what was extracted from your resume'
              : 'Upload your existing resume and we\'ll automatically extract the information using AI.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!showAnalysis ? (
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
