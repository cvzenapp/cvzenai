import { Router } from 'express';
import { tavilyService } from '../services/tavilyService.js';

const router = Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Job extraction route working' });
});

/**
 * Extract detailed job information from URL using Tavily
 */
router.post('/extract-details', async (req, res) => {
  console.log('🔍 Job extraction endpoint hit:', req.body);
  
  try {
    const { url } = req.body;

    if (!url) {
      console.log('❌ No URL provided');
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    console.log(`🔍 Extracting job details from: ${url}`);

    // Extract job details using Tavily
    const extractedContent = await tavilyService.extractJobDetails(url);
    console.log('✅ Tavily extraction completed, content length:', extractedContent?.length || 0);

    // Parse the extracted content into structured format
    const details = parseJobContent(extractedContent || '');
    console.log('✅ Job details parsed:', Object.keys(details));

    const response = {
      success: true,
      details,
      rawContent: extractedContent || ''
    };
    
    console.log('✅ Sending response:', JSON.stringify(response, null, 2));
    return res.json(response);

  } catch (error) {
    console.error('❌ Job extraction error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to extract job details'
    });
  }
});

/**
 * Parse extracted job content into structured format
 */
function parseJobContent(content: string) {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  
  const details: any = {};
  
  for (const line of lines) {
    if (line.startsWith('Job Title:')) {
      details.title = line.replace('Job Title:', '').trim();
    } else if (line.startsWith('Company:')) {
      details.company = line.replace('Company:', '').trim();
    } else if (line.startsWith('Description:')) {
      details.description = line.replace('Description:', '').trim();
    } else if (line.startsWith('Location:')) {
      details.location = line.replace('Location:', '').trim();
    } else if (line.startsWith('Salary:')) {
      details.salary = line.replace('Salary:', '').trim();
    } else if (line.startsWith('Type:')) {
      details.type = line.replace('Type:', '').trim();
    }
  }

  // Extract requirements and benefits if present
  const contentLower = content.toLowerCase();
  
  if (contentLower.includes('requirements') || contentLower.includes('qualifications')) {
    details.requirements = extractListItems(content, ['requirements', 'qualifications', 'skills']);
  }
  
  if (contentLower.includes('benefits') || contentLower.includes('perks')) {
    details.benefits = extractListItems(content, ['benefits', 'perks', 'offers']);
  }

  return details;
}

/**
 * Extract list items from content based on keywords
 */
function extractListItems(content: string, keywords: string[]): string[] {
  const items: string[] = [];
  const lines = content.split('\n');
  
  for (const keyword of keywords) {
    const keywordIndex = lines.findIndex(line => 
      line.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (keywordIndex !== -1) {
      // Look for bullet points or numbered items after the keyword
      for (let i = keywordIndex + 1; i < lines.length && i < keywordIndex + 10; i++) {
        const line = lines[i].trim();
        if (line.match(/^[-•*]\s+/) || line.match(/^\d+\.\s+/)) {
          items.push(line.replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, '').trim());
        } else if (line && !line.includes(':') && line.length > 10) {
          items.push(line);
        }
      }
      break; // Stop after finding the first matching section
    }
  }
  
  return items.slice(0, 8); // Limit to 8 items
}

export default router;