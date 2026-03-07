import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, 
  Share2, 
  Copy, 
  CheckCircle,
  Linkedin,
  Facebook,
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JobPostingSuccessCardProps {
  message: string;
  shareData: {
    url: string;
    title: string;
    description: string;
    jobTitle: string;
    companyName: string;
  };
}

// X (Twitter) icon component
const XIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

export const JobPostingSuccessCard: React.FC<JobPostingSuccessCardProps> = ({ 
  message, 
  shareData 
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "Job posting URL copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const shareOnLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.url)}&title=${encodeURIComponent(shareData.title)}&summary=${encodeURIComponent(shareData.description)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
  };

  const shareOnX = () => {
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareData.title} - ${shareData.description}`)}&url=${encodeURIComponent(shareData.url)}`;
    window.open(xUrl, '_blank', 'width=600,height=400');
  };

  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}&quote=${encodeURIComponent(shareData.title)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(shareData.title);
    const body = encodeURIComponent(`${shareData.description}\n\nApply here: ${shareData.url}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const openJobPosting = () => {
    window.open(shareData.url, '_blank');
  };

  return (
    <Card className="mb-4 border-green-200 bg-green-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-sm text-green-800 font-medium">{message}</p>
              <Badge variant="outline" className="mt-2 text-green-700 border-green-300">
                {shareData.jobTitle}
              </Badge>
            </div>

            {/* Job URL Section */}
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Public Job URL:</p>
                  <button
                    onClick={openJobPosting}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate block w-full text-left"
                    title={shareData.url}
                  >
                    {shareData.url}
                  </button>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyToClipboard}
                    className="h-8 px-2"
                  >
                    {copied ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openJobPosting}
                    className="h-8 px-2"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Social Sharing Section */}
              <div className="border-t border-gray-200 pt-3">
                <p className="text-xs text-gray-500 mb-2">Share on social media:</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={shareOnLinkedIn}
                    className="h-8 px-3 text-xs bg-blue-50 hover:bg-blue-100 border-blue-200"
                  >
                    <Linkedin className="h-3 w-3 mr-1 text-blue-600" />
                    LinkedIn
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={shareOnX}
                    className="h-8 px-3 text-xs bg-gray-50 hover:bg-gray-100 border-gray-200"
                  >
                    <XIcon className="h-3 w-3 mr-1 text-gray-800" />
                    X
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={shareOnFacebook}
                    className="h-8 px-3 text-xs bg-blue-50 hover:bg-blue-100 border-blue-200"
                  >
                    <Facebook className="h-3 w-3 mr-1 text-blue-600" />
                    Facebook
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={shareViaEmail}
                    className="h-8 px-3 text-xs bg-gray-50 hover:bg-gray-100 border-gray-200"
                  >
                    <Mail className="h-3 w-3 mr-1 text-gray-600" />
                    Email
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={openJobPosting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Job Posting
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};