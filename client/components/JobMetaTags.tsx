import { useEffect } from 'react';

interface JobMetaTagsProps {
  jobTitle: string;
  companyName: string;
  location: string;
  description: string;
  jobUrl: string;
  companyLogo?: string;
  salaryRange?: string;
  jobType?: string;
  experienceLevel?: string;
}

export const JobMetaTags: React.FC<JobMetaTagsProps> = ({
  jobTitle,
  companyName,
  location,
  description,
  jobUrl,
  companyLogo,
  salaryRange,
  jobType,
  experienceLevel
}) => {
  useEffect(() => {
    const pageTitle = `${jobTitle} at ${companyName} - CVZen Jobs`;
    const pageDescription = `${jobTitle} position at ${companyName} in ${location}. ${description.substring(0, 150)}...`;
    const imageUrl = companyLogo || `${window.location.origin}/assets/cvzen_logo.png`;

    // Update document title
    document.title = pageTitle;

    // Function to update or create meta tag
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

    // Basic Meta Tags
    updateMetaTag('description', pageDescription);
    updateMetaTag('keywords', `${jobTitle}, ${companyName}, ${location}, jobs, hiring, career, ${jobType}, ${experienceLevel}`);
    
    // Open Graph Meta Tags
    updateMetaTag('og:title', pageTitle, true);
    updateMetaTag('og:description', pageDescription, true);
    updateMetaTag('og:type', 'website', true);
    updateMetaTag('og:url', jobUrl, true);
    updateMetaTag('og:image', imageUrl, true);
    updateMetaTag('og:image:width', '1200', true);
    updateMetaTag('og:image:height', '630', true);
    updateMetaTag('og:site_name', 'CVZen Jobs', true);
    updateMetaTag('og:locale', 'en_US', true);
    
    // Twitter Card Meta Tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', pageTitle);
    updateMetaTag('twitter:description', pageDescription);
    updateMetaTag('twitter:image', imageUrl);
    updateMetaTag('twitter:site', '@CVZen');
    updateMetaTag('twitter:creator', '@CVZen');
    
    // LinkedIn Meta Tags
    updateMetaTag('linkedin:title', pageTitle, true);
    updateMetaTag('linkedin:description', pageDescription, true);
    updateMetaTag('linkedin:image', imageUrl, true);

    // Add structured data for job posting
    const structuredData = {
      "@context": "https://schema.org/",
      "@type": "JobPosting",
      "title": jobTitle,
      "description": description,
      "hiringOrganization": {
        "@type": "Organization",
        "name": companyName,
        "logo": companyLogo
      },
      "jobLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": location
        }
      },
      "employmentType": jobType?.toUpperCase(),
      "experienceRequirements": experienceLevel,
      "baseSalary": salaryRange ? {
        "@type": "MonetaryAmount",
        "currency": "USD",
        "value": {
          "@type": "QuantitativeValue",
          "value": salaryRange
        }
      } : undefined,
      "datePosted": new Date().toISOString(),
      "validThrough": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      "url": jobUrl,
      "applicationContact": {
        "@type": "ContactPoint",
        "contactType": "HR",
        "url": jobUrl
      }
    };

    // Remove existing structured data script
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data script
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      // Reset title when component unmounts
      document.title = 'CVZen - Professional Resume Builder';
    };
  }, [jobTitle, companyName, location, description, jobUrl, companyLogo, salaryRange, jobType, experienceLevel]);

  return null; // This component doesn't render anything
};