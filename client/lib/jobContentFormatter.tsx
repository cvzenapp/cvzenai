import React from 'react';

interface FormattedContentProps {
  content: string;
  className?: string;
}

export function formatJobContent(content: string): React.ReactNode {
  if (!content || typeof content !== 'string' || !content.trim()) return null;

  // Split content into lines and process each line
  const lines = content.split('\n').filter(line => line.trim());
  const formattedElements: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) return;

    // Check if line looks like a bullet point (starts with -, •, *, or number)
    const bulletPatterns = [
      /^[-•*]\s+(.+)$/,           // - bullet, • bullet, * bullet
      /^\d+\.\s+(.+)$/,          // 1. numbered
      /^[a-zA-Z]\.\s+(.+)$/,     // a. lettered
      /^[A-Z][a-z]+\s*:\s*(.+)$/, // "JavaScript: ES6+" format
    ];

    let isBullet = false;
    let bulletContent = '';

    for (const pattern of bulletPatterns) {
      const match = trimmedLine.match(pattern);
      if (match) {
        isBullet = true;
        bulletContent = match[1];
        break;
      }
    }

    // Special handling for technology lists (comma-separated items)
    if (!isBullet && trimmedLine.includes(',') && trimmedLine.length > 50) {
      const techItems = trimmedLine.split(',').map(item => item.trim()).filter(item => item);
      if (techItems.length > 2) {
        // Convert comma-separated list to bullet points
        techItems.forEach((item, techIndex) => {
          formattedElements.push(
            <li key={`${index}-${techIndex}`} className="text-gray-700 leading-relaxed">
              {item}
            </li>
          );
        });
        return;
      }
    }

    if (isBullet) {
      formattedElements.push(
        <li key={index} className="text-gray-700 leading-relaxed">
          {bulletContent}
        </li>
      );
    } else {
      // Check if it's a heading (all caps, ends with colon, or short line)
      const isHeading = 
        trimmedLine.length < 60 && 
        (trimmedLine.endsWith(':') || 
         trimmedLine === trimmedLine.toUpperCase() ||
         /^[A-Z][A-Za-z\s&]+:?$/.test(trimmedLine) ||
         /^(Requirements?|Qualifications?|Responsibilities?|Skills?|Experience?|Education?|Benefits?|About|Overview|Description)$/i.test(trimmedLine));

      if (isHeading) {
        formattedElements.push(
          <h4 key={index} className="font-semibold text-gray-900 mt-6 mb-3 first:mt-0 text-lg">
            {trimmedLine.replace(/:$/, '')}
          </h4>
        );
      } else {
        // Regular paragraph
        formattedElements.push(
          <p key={index} className="text-gray-700 leading-relaxed mb-3">
            {trimmedLine}
          </p>
        );
      }
    }
  });

  // Group consecutive bullet points into ul elements
  const groupedElements: React.ReactNode[] = [];
  let currentBullets: React.ReactNode[] = [];

  formattedElements.forEach((element, index) => {
    if (React.isValidElement(element) && element.type === 'li') {
      currentBullets.push(element);
    } else {
      // If we have accumulated bullets, wrap them in ul
      if (currentBullets.length > 0) {
        groupedElements.push(
          <ul key={`ul-${index}`} className="list-disc list-inside space-y-2 mb-6 ml-4 text-gray-700">
            {currentBullets}
          </ul>
        );
        currentBullets = [];
      }
      groupedElements.push(element);
    }
  });

  // Handle any remaining bullets
  if (currentBullets.length > 0) {
    groupedElements.push(
      <ul key="ul-final" className="list-disc list-inside space-y-2 mb-6 ml-4 text-gray-700">
        {currentBullets}
      </ul>
    );
  }

  return <div className="space-y-1">{groupedElements}</div>;
}

export function FormattedJobContent({ content, className = "" }: FormattedContentProps) {
  if (!content || typeof content !== 'string' || !content.trim()) {
    return (
      <div className={className}>
        <p className="text-gray-500 italic">No content available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {formatJobContent(content)}
    </div>
  );
}