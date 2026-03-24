import { useState, useEffect } from 'react';
import { X, ExternalLink, Loader2, FileText, Building, MapPin, DollarSign, Clock } from 'lucide-react';

interface JobDetailsExtractModalProps {
  jobUrl: string;
  jobTitle: string;
  company: string;
  onClose: () => void;
  onApply: (extractedDetails: any) => void;
}

interface ExtractedJobDetails {
  title?: string;
  company?: string;
  location?: string;
  salary?: string;
  type?: string;
  description?: string;
  requirements?: string[];
  benefits?: string[];
}

export function JobDetailsExtractModal({ 
  jobUrl, 
  jobTitle, 
  company, 
  onClose, 
  onApply 
}: JobDetailsExtractModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [extractedDetails, setExtractedDetails] = useState<ExtractedJobDetails | null>(null);

  useEffect(() => {
    extractJobDetails();
  }, [jobUrl]);

  const extractJobDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Call Tavily extract API
      const response = await fetch('/api/job-extraction/extract-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: jobUrl }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Modal received data:', data);
      
      if (data.success) {
        setExtractedDetails(data.details);
      } else {
        setError(data.error || 'Failed to extract job details');
      }
    } catch (err) {
      console.error('Error extracting job details:', err);
      setError('Failed to extract job details');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    onApply(extractedDetails);
  };

  const handleViewOriginal = () => {
    window.open(jobUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Job Details</h2>
            <p className="text-sm text-gray-600 mt-1">Extracted information from job posting</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Extracting job details...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <p className="text-red-600 mb-4">{error}</p>
                <div className="space-x-3">
                  <button
                    onClick={extractJobDetails}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Retry
                  </button>
                  <button
                    onClick={handleViewOriginal}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    View Original
                  </button>
                </div>
              </div>
            </div>
          ) : extractedDetails ? (
            <div className="space-y-6">
              {/* Debug: Show raw response */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
                <h4 className="font-semibold text-yellow-800 mb-2">Debug Info:</h4>
                <pre className="text-yellow-700 whitespace-pre-wrap">
                  {JSON.stringify(extractedDetails, null, 2)}
                </pre>
              </div>

              {/* Job Header */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {extractedDetails.title || jobTitle}
                </h3>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {(extractedDetails.company || company) && (
                    <div className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      <span>{extractedDetails.company || company}</span>
                    </div>
                  )}
                  {extractedDetails.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{extractedDetails.location}</span>
                    </div>
                  )}
                  {extractedDetails.salary && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span>{extractedDetails.salary}</span>
                    </div>
                  )}
                  {extractedDetails.type && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{extractedDetails.type}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Job Description */}
              {extractedDetails.description && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Description</h4>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{extractedDetails.description}</p>
                  </div>
                </div>
              )}

              {/* Requirements */}
              {extractedDetails.requirements && extractedDetails.requirements.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h4>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <ul className="space-y-2">
                      {extractedDetails.requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                          <span className="text-gray-700">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Benefits */}
              {extractedDetails.benefits && extractedDetails.benefits.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Benefits</h4>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <ul className="space-y-2">
                      {extractedDetails.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                          <span className="text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No details extracted</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={handleViewOriginal}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View Original
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              Apply Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}