import { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import { Loader2, AlertCircle } from 'lucide-react';

interface DocxViewerProps {
  url: string;
  className?: string;
}

export function DocxViewer({ url, className = '' }: DocxViewerProps) {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDocument = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch the DOCX file
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch document');
        }

        // Get the file as an ArrayBuffer
        const arrayBuffer = await response.arrayBuffer();

        // Convert DOCX to HTML using mammoth
        const result = await mammoth.convertToHtml({ arrayBuffer });
        
        setHtml(result.value);

        // Log any warnings from mammoth
        if (result.messages.length > 0) {
          console.log('Mammoth conversion messages:', result.messages);
        }
      } catch (err) {
        console.error('Error loading DOCX:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [url]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-8">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
        <p className="text-slate-600">Loading document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <div className="text-center">
          <p className="text-slate-900 font-medium mb-2">Failed to load document</p>
          <p className="text-slate-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`docx-viewer-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
