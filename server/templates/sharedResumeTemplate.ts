export const generateSharedResumeHTML = (metadata: {
  title: string;
  description: string;
  name: string;
  jobTitle: string;
  location?: string;
  skills?: string;
  yearsOfExperience?: number;
  summary?: string;
  url: string;
  image: string;
  type: string;
}, shareToken: string) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Basic Meta Tags -->
  <title>${metadata.title}</title>
  <meta name="description" content="${metadata.description}">
  <meta name="keywords" content="${metadata.name.toLowerCase()}, ${metadata.jobTitle.toLowerCase()}, resume, cv, ${metadata.skills?.toLowerCase() || ''}">
  <meta name="author" content="${metadata.name}">
  <meta name="robots" content="index, follow">
  
  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="${metadata.title}">
  <meta property="og:description" content="${metadata.description}">
  <meta property="og:type" content="${metadata.type}">
  <meta property="og:url" content="${metadata.url}">
  <meta property="og:image" content="${metadata.image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="CVZen">
  <meta property="og:locale" content="en_US">
  
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${metadata.title}">
  <meta name="twitter:description" content="${metadata.description}">
  <meta name="twitter:image" content="${metadata.image}">
  <meta name="twitter:site" content="@cvzen">
  <meta name="twitter:creator" content="@cvzen">
  
  <!-- LinkedIn Specific -->
  <meta property="linkedin:owner" content="${metadata.name}">
  
  <!-- Professional Profile Meta Tags -->
  <meta property="profile:first_name" content="${metadata.name.split(' ')[0] || ''}">
  <meta property="profile:last_name" content="${metadata.name.split(' ').slice(1).join(' ') || ''}">
  <meta property="profile:username" content="${metadata.name.toLowerCase().replace(/\s+/g, '')}">
  
  <!-- WhatsApp Meta Tags -->
  <meta property="og:image:alt" content="${metadata.title} - Professional Resume">
  
  <!-- Structured Data for Search Engines -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "${metadata.name}",
    "jobTitle": "${metadata.jobTitle}",
    "description": "${metadata.summary || metadata.description}",
    "url": "${metadata.url}",
    "image": "${metadata.image}",
    ${metadata.location ? `"address": {
      "@type": "PostalAddress",
      "addressLocality": "${metadata.location}"
    },` : ''}
    ${metadata.skills ? `"knowsAbout": ${JSON.stringify(metadata.skills.split(', ').filter(Boolean))},` : ''}
    "sameAs": [
      "${metadata.url}"
    ]
  }
  </script>
  
  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  
  <!-- Canonical URL -->
  <link rel="canonical" href="${metadata.url}">
  
  <!-- Preload critical resources -->
  <link rel="preload" href="${metadata.image}" as="image">
  
  <!-- CSS for loading state -->
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .loading-container {
      text-align: center;
      color: white;
      padding: 2rem;
    }
    
    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top: 3px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .preview-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      margin-top: 2rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      max-width: 400px;
      text-align: left;
    }
    
    .preview-card h2 {
      margin: 0 0 0.5rem 0;
      color: #333;
      font-size: 1.5rem;
    }
    
    .preview-card p {
      margin: 0.5rem 0;
      color: #666;
      line-height: 1.5;
    }
    
    .skills-tag {
      display: inline-block;
      background: #e3f2fd;
      color: #1976d2;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.875rem;
      margin: 0.25rem 0.25rem 0 0;
    }
  </style>
</head>
<body>
  <div class="loading-container">
    <div class="loading-spinner"></div>
    <h1>Loading ${metadata.name}'s Resume</h1>
    <p>Please wait while we prepare the professional resume...</p>
    
    <!-- Preview Card for Social Sharing -->
    <div class="preview-card">
      <h2>${metadata.name}</h2>
      <p><strong>${metadata.jobTitle}</strong></p>
      ${metadata.location ? `<p>📍 ${metadata.location}</p>` : ''}
      ${metadata.summary ? `<p>${metadata.summary}</p>` : ''}
      ${metadata.skills ? `
        <div style="margin-top: 1rem;">
          <strong>Skills:</strong><br>
          ${metadata.skills.split(', ').map(skill => `<span class="skills-tag">${skill}</span>`).join('')}
        </div>
      ` : ''}
      ${metadata.yearsOfExperience ? `<p><strong>${metadata.yearsOfExperience}+ years</strong> of experience</p>` : ''}
    </div>
  </div>
  
  <!-- Redirect to React app -->
  <script>
    // Redirect to the React app after a short delay to allow social crawlers to read meta tags
    setTimeout(() => {
      window.location.href = '/share/${shareToken}';
    }, 2000);
    
    // Immediate redirect for regular browsers (not crawlers)
    if (!/bot|crawler|spider|crawling/i.test(navigator.userAgent)) {
      window.location.href = '/share/${shareToken}';
    }
  </script>
</body>
</html>
  `.trim();
};