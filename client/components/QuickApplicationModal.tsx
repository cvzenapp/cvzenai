import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, User, Upload, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { 
    name: string; 
    email: string; 
    resumeFile: File;
    userId?: string;
    resumeId?: number;
    shareToken?: string;
    resumeUrl?: string;
  }) => Promise<void>;
  jobTitle: string;
  companyName: string;
}

export default function QuickApplicationModal({
  isOpen,
  onClose,
  jobTitle,
  companyName,
  onSubmit
}: QuickApplicationModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF, DOC, or DOCX file');
      return;
    }

    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return;
    }

    setResumeFile(file);
    setError('');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!resumeFile) {
      setError('Please upload your resume');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Parse resume with guest resume parsing service
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('name', name);
      formData.append('email', email);

      const parseResponse = await fetch('/api/guest/resume/parse', {
        method: 'POST',
        body: formData
      });

      if (!parseResponse.ok) {
        const errorData = await parseResponse.json();
        throw new Error(errorData.error || 'Failed to parse resume');
      }

      const parseResult = await parseResponse.json();

      if (!parseResult.success) {
        throw new Error(parseResult.error || 'Failed to parse resume');
      }

      // Step 2: Submit application with parsed resume data
      await onSubmit({ 
        name, 
        email, 
        resumeFile,
        userId: parseResult.data.userId,
        resumeId: parseResult.data.resumeId,
        shareToken: parseResult.data.shareToken,
        resumeUrl: parseResult.data.resumeUrl
      });

      // Reset form
      setName('');
      setEmail('');
      setResumeFile(null);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
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
                <h2 className="text-2xl font-bold">Quick Apply</h2>
                <p className="text-blue-100 text-sm mt-1">
                  {jobTitle} at {companyName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {/* Resume Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Resume
                </label>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : resumeFile
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <input
                    type="file"
                    id="resume-upload"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  {resumeFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div className="text-left">
                        <p className="font-medium text-slate-900">{resumeFile.name}</p>
                        <p className="text-sm text-slate-600">
                          {(resumeFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setResumeFile(null)}
                        className="ml-auto p-1 hover:bg-red-100 rounded text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-700 font-medium mb-1">
                        Drop your resume here or{' '}
                        <label
                          htmlFor="resume-upload"
                          className="text-blue-600 hover:text-blue-700 cursor-pointer underline"
                        >
                          browse
                        </label>
                      </p>
                      <p className="text-xs text-slate-500">
                        PDF, DOC, or DOCX (max 5MB)
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </Button>

              <p className="text-xs text-slate-500 text-center">
                By submitting, you agree to share your information with {companyName}
              </p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
