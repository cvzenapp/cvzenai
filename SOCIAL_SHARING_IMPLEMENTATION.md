# Social Sharing Implementation for Resume Viewer

This implementation adds comprehensive social sharing functionality to the resume viewer with proper Open Graph meta tags for rich previews when shared on social platforms.

## Features Implemented

### 1. Social Share Icons Component (`SocialShareIcons.tsx`)
- **Location**: Integrated into the contact information section of `ResumeDisplay.tsx`
- **Platforms**: WhatsApp, LinkedIn, Facebook, Twitter, Email, Copy Link
- **Variants**: 
  - `icons` - Small icon buttons (default)
  - `buttons` - Full buttons with labels
  - `compact` - Single share button
- **Auto-generates share links** when needed

### 2. Social Share Modal (`SocialShareModal.tsx`)
- **Full-featured sharing dialog** with all social platforms
- **Preview card** showing how the resume will appear when shared
- **Copy link functionality** with clipboard API
- **Platform-specific sharing** with optimized text and URLs

### 3. Enhanced Share Button (`EnhancedShareButton.tsx`)
- **Replacement for existing share functionality**
- **Quick copy button** for generated links
- **Loading states** and error handling

### 4. Meta Tags for Social Sharing (`ResumeMetaTags.tsx`)
- **Automatically generates** Open Graph and Twitter Card meta tags
- **Structured data** for search engines (JSON-LD)
- **Dynamic content** based on resume data
- **Professional profile tags** for LinkedIn

### 5. Server-Side Meta Tag Generation
- **HTML template** (`sharedResumeTemplate.ts`) for social crawlers
- **API endpoints** (`resumeMetadata.ts`) for metadata and OG images
- **Crawler detection** to serve appropriate content
- **SVG-based Open Graph images** with resume information

## Integration Points

### Client-Side Integration

1. **ResumeViewer.tsx**:
   ```tsx
   import { ResumeMetaTags } from "@/components/ResumeMetaTags";
   
   // Add meta tags for social sharing
   <ResumeMetaTags resume={resume} shareToken={shareToken} />
   ```

2. **ResumeDisplay.tsx**:
   ```tsx
   import { SocialShareIcons } from "@/components/SocialShareIcons";
   
   // Add to contact info section
   <SocialShareIcons 
     resume={resume} 
     size="sm" 
     variant="icons"
     className="border-l border-gray-300 pl-4"
   />
   ```

### Server-Side Integration

1. **server/index.ts**:
   ```typescript
   // Route for shared resume pages with crawler detection
   app.get("/share/:shareToken", async (req, res) => {
     // Serves HTML with meta tags for crawlers
     // Serves React app for regular users
   });
   ```

2. **server/routes/resumeMetadata.ts**:
   - `/api/resume/share-preview/:shareToken` - HTML with meta tags
   - `/api/resume/metadata/:shareToken` - JSON metadata API
   - `/api/resume/og-image/:shareToken` - SVG Open Graph image

## How It Works

### 1. Share Link Generation
- User clicks share button
- API generates secure share token
- Returns shareable URL: `https://cvzen.in/share/{token}`

### 2. Social Media Crawling
- Social platforms request the share URL
- Server detects crawler via User-Agent
- Serves HTML with rich meta tags instead of React app
- Crawlers extract Open Graph data for rich previews

### 3. User Experience
- Regular users get the full React application
- Social media users see rich previews with:
  - Professional photo or generated image
  - Name and job title
  - Skills and experience summary
  - CVZen branding

### 4. Meta Tag Content
Generated dynamically from resume data:
- **Title**: "John Doe - Software Engineer"
- **Description**: Job title, location, skills, years of experience
- **Image**: Profile photo or auto-generated professional card
- **Structured Data**: JSON-LD for search engines

## Usage Examples

### Basic Social Sharing
```tsx
<SocialShareIcons resume={resume} />
```

### Button Variant
```tsx
<SocialShareIcons 
  resume={resume} 
  variant="buttons" 
  size="lg" 
/>
```

### Enhanced Share Button
```tsx
<EnhancedShareButton 
  resume={resume}
  variant="outline"
  className="my-custom-class"
/>
```

## Technical Details

### Meta Tags Generated
- **Open Graph**: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`
- **Twitter Cards**: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- **LinkedIn**: `linkedin:owner`
- **Professional Profile**: `profile:first_name`, `profile:last_name`
- **Structured Data**: Person schema with job details

### Security Features
- **Share tokens** expire after set time
- **Database validation** for all shared resumes
- **Rate limiting** on share generation
- **Secure token generation** using crypto

### Performance Optimizations
- **Cached meta tags** (1 hour TTL)
- **SVG images** for fast loading
- **Minimal HTML** for crawlers
- **Lazy loading** of share modals

## Browser Compatibility
- **Modern browsers**: Full functionality with Clipboard API
- **Older browsers**: Fallback copy methods
- **Mobile devices**: Native sharing when available
- **Social crawlers**: Server-rendered HTML with meta tags

## Customization Options
- **Platform selection**: Enable/disable specific platforms
- **Styling**: Full CSS customization support
- **Content**: Custom share text and descriptions
- **Images**: Custom Open Graph images or auto-generated cards