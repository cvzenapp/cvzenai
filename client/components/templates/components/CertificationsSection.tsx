import React from 'react';
import { Award, Calendar, Building2, ExternalLink } from 'lucide-react';
import { Certification } from '@shared/api';

interface CertificationsSectionProps {
  certifications: Certification[];
  primaryColor?: string;
  accentColor?: string;
  className?: string;
}

export function CertificationsSection({
  certifications,
  primaryColor = '#3b82f6',
  accentColor = '#60a5fa',
  className = ''
}: CertificationsSectionProps) {
  if (!certifications || certifications.length === 0) {
    return null;
  }

  return (
    <div className={`certifications-section ${className}`}>
      <h2 
        className="text-2xl font-bold mb-6 flex items-center gap-2"
        style={{ color: `var(--template-primary-color, ${primaryColor})` }}
      >
        <Award className="w-6 h-6" />
        Certifications
      </h2>

      <div className="space-y-3">
        {certifications.map((cert, index) => (
          <div
            key={index}
            className="certification-row flex items-start gap-4 p-4 rounded-lg border transition-all duration-200 hover:shadow-md"
            style={{
              borderColor: `var(--template-border-color, #e5e7eb)`,
              backgroundColor: `var(--template-background-color, #ffffff)`
            }}
          >
            {/* Icon */}
            <div 
              className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, var(--template-primary-color, ${primaryColor}), var(--template-accent-color, ${accentColor}))`
              }}
            >
              <Award className="w-6 h-6 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h3 
                    className="font-semibold text-lg mb-1"
                    style={{ color: `var(--template-primary-color, ${primaryColor})` }}
                  >
                    {cert.name}
                  </h3>
                  
                  <div className="flex items-center gap-4 flex-wrap text-sm mb-2">
                    {cert.issuer && (
                      <div 
                        className="flex items-center gap-2"
                        style={{ color: `var(--template-text-color, #1f2937)` }}
                      >
                        <Building2 className="w-4 h-4" style={{ color: `var(--template-text-muted, #6b7280)` }} />
                        <span>{cert.issuer}</span>
                      </div>
                    )}

                    {cert.date && (
                      <div 
                        className="flex items-center gap-2"
                        style={{ color: `var(--template-text-muted, #6b7280)` }}
                      >
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(cert.date)}</span>
                      </div>
                    )}
                  </div>

                  {cert.description && (
                    <p 
                      className="text-sm"
                      style={{ color: `var(--template-text-muted, #6b7280)` }}
                    >
                      {cert.description}
                    </p>
                  )}
                </div>

                {/* View Credential Link */}
                {cert.url && (
                  <a
                    href={cert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md"
                    style={{ 
                      backgroundColor: `var(--template-primary-color, ${primaryColor})`,
                      color: 'white'
                    }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Credential
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function to format date
function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  // Handle YYYY-MM format
  if (dateString.match(/^\d{4}-\d{2}$/)) {
    const [year, month] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  }
  
  // Handle full date
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}
