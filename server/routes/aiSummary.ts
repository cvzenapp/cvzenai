import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { groqService } from '../services/groqService';

const router = express.Router();

// Generate AI-enhanced professional summary
router.post('/generate-summary', authenticateToken, async (req, res) => {
  try {
    const { personalInfo, experiences, skills, education, currentSummary } = req.body;

    if (!personalInfo) {
      return res.status(400).json({
        success: false,
        error: 'Personal information is required'
      });
    }

    // Build context for AI
    const context = {
      name: personalInfo.name,
      title: personalInfo.title,
      skills: skills?.slice(0, 10) || [], // Top 10 skills
      experiences: experiences?.slice(0, 3) || [], // Recent 3 experiences
      education: education?.slice(0, 2) || [], // Top 2 education entries
      currentSummary
    };

    const prompt = `Create a compelling professional summary for ${context.name}, a ${context.title || 'professional'}.

Context:
- Current summary: ${context.currentSummary || 'None provided'}
- Key skills: ${context.skills.map(s => s.name || s).join(', ')}
- Recent experience: ${context.experiences.map(exp => `${exp.position} at ${exp.company}`).join(', ')}
- Education: ${context.education.map(edu => `${edu.degree} from ${edu.institution}`).join(', ')}

Requirements:
- Write in first person
- Keep it concise (2-3 sentences, max 150 words)
- Highlight key strengths and value proposition
- Make it compelling and professional
- Focus on achievements and impact
- Avoid generic phrases

Return only the professional summary text, no additional formatting or explanations.`;

    const aiResponse = await groqService.generateText(prompt);
    
    if (!aiResponse) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate AI summary'
      });
    }

    res.json({
      success: true,
      data: {
        summary: aiResponse.trim()
      }
    });

  } catch (error) {
    console.error('Error generating AI summary:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;