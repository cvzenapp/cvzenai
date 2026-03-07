import React, { useEffect } from 'react';
import { Resume } from '@shared/api';

interface ResumeMetaTagsProps {
  resume: Resume;
  shareToken?: string;
}

export const ResumeMetaTags: React.FC<ResumeMetaTagsProps> = ({ resume, shareToken }) => {
  useEffect(() => {
    if (!resume) return;

    const name = resume.personalInfo.name || 'Professional';
    const title = resume.personalInfo.title || 'Professional';
    const summary = resume.summary || '';
    const location = resume.personalInfo.location || '';
    const skills = resume.skills?.slice(0, 5).map(skill => 
      typeof skill === 'string' ? skill : skill.name
    ).join(', ') || '';
    
    const yearsOfExperience = resume.experiences?.length > 0 ? 
      Math.max(...resume.experiences.map(exp => {
        const startYear = new Date(exp.startDate || '2020').getFullYear();
        const endYear = exp.endDate ? 
          new Date(exp.endDate).getFullYear() : 
          new Date().getFullYear();
        return endYear - startYear;
      })) : 0;

    // Generate meta content
    const metaTitle = `${name} - ${title}`;
    const metaDescription = summary || 
      `${title}${location ? ` based in ${location}` : ''}${skills ? ` | Skills: ${skills}` : ''}${yearsOfExperience > 0 ? ` | ${yearsOfExperience}+ years experience` : ''}`;
    
    const currentUrl = shareToken ? 
      `${window.location.origin}/share/${shareToken}` : 
      window.location.href;
    
    const imageUrl = resume.personalInfo.avatar || 
      `${window.location.origin}/api/resume/og-image/${shareToken || resume.id}`;

    // Update document title
    document.title = metaTitle;

    // Update or create meta tags
    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', property);
        }
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', metaDescription.substring(0, 160));
    updateMetaTag('keywords', `${name}, ${title}, resume, CV, ${skills}`.toLowerCase());
    updateMetaTag('author', name);

    // Open Graph tags
    updateMetaTag('og:title', metaTitle, true);
    updateMetaTag('og:description', metaDescription.substring(0, 160), true);
    updateMetaTag('og:type', 'profile', true);
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('og:image', imageUrl, true);
    updateMetaTag('og:image:width', '1200', true);
    updateMetaTag('og:image:height', '630', true);
    updateMetaTag('og:site_name', 'CVZen', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', metaTitle);
    updateMetaTag('twitter:description', metaDescription.substring(0, 160));
    updateMetaTag('twitter:image', imageUrl);
    updateMetaTag('twitter:site', '@cvzen');

    // LinkedIn specific tags
    updateMetaTag('linkedin:owner', name);

    // Professional profile specific tags
    updateMetaTag('profile:first_name', name.split(' ')[0] || '', true);
    updateMetaTag('profile:last_name', name.split(' ').slice(1).join(' ') || '', true);
    updateMetaTag('profile:username', name.toLowerCase().replace(/\s+/g, ''), true);

    // Structured data for search engines
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": name,
      "jobTitle": title,
      "description": summary,
      "url": currentUrl,
      "image": imageUrl,
      "address": location ? {
        "@type": "PostalAddress",
        "addressLocality": location
      } : undefined,
      "knowsAbout": skills.split(', ').filter(Boolean),
      "alumniOf": resume.education?.map(edu => ({
        "@type": "EducationalOrganization",
        "name": edu.institution
      })) || [],
      "worksFor": resume.experiences?.[0] ? {
        "@type": "Organization",
        "name": resume.experiences[0].company
      } : undefined
    };

    // Update or create structured data script
    let structuredDataScript = document.querySelector('script[type="application/ld+json"]');
    if (!structuredDataScript) {
      structuredDataScript = document.createElement('script');
      structuredDataScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(structuredDataScript);
    }
    structuredDataScript.textContent = JSON.stringify(structuredData, null, 2);

    // Cleanup function to remove meta tags when component unmounts
    return () => {
      // Note: We don't remove meta tags on unmount as they should persist
      // for the page lifecycle. They'll be updated when the component re-mounts
      // with different data.
    };
  }, [resume, shareToken]);

  // This component doesn't render anything visible
  return null;
};