import express from 'express';
import { requireAuth } from '../middleware/unifiedAuth';
import { groqService } from '../services/groqService';

const router = express.Router();

// Generate AI-enhanced professional summary
router.post('/generate-summary', requireAuth, async (req, res) => {
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

    const aiResponse = await groqService.generateResponse(
      'You are a professional resume writer. Create compelling professional summaries.',
      prompt,
      {
        temperature: 0.7,
        maxTokens: 200
      }
    );
    
    if (!aiResponse?.response) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate AI summary'
      });
    }

    res.json({
      success: true,
      data: {
        summary: aiResponse.response.trim()
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

// Generate AI-enhanced skills suggestions
router.post('/generate-skills', requireAuth, async (req, res) => {
  try {
    const { personalInfo, experiences, education, currentSkills } = req.body;

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
      experiences: experiences?.slice(0, 3) || [],
      education: education?.slice(0, 2) || [],
      currentSkills: currentSkills || []
    };

    const prompt = `Suggest relevant technical and professional skills for ${context.name}, a ${context.title || 'professional'}.

Context:
- Current skills: ${context.currentSkills.map(s => s.name || s).join(', ')}
- Recent experience: ${context.experiences.map(exp => `${exp.position} at ${exp.company} - ${exp.description || 'No description'}`).join(', ')}
- Education: ${context.education.map(edu => `${edu.degree} in ${edu.field} from ${edu.institution}`).join(', ')}

Requirements:
- Suggest 8-12 relevant skills
- Include both technical and soft skills
- Focus on skills relevant to their field and experience
- Avoid duplicating existing skills
- Include modern, in-demand skills for their industry
- Return as a JSON array of skill objects with "name" property

Return only a JSON array in this format: [{"name": "Skill Name"}, {"name": "Another Skill"}]`;

    const aiResponse = await groqService.generateResponse(
      'You are a career advisor. Suggest relevant skills based on experience and education.',
      prompt,
      {
        temperature: 0.5,
        maxTokens: 300
      }
    );
    
    if (!aiResponse?.response) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate AI skills'
      });
    }

    // Try to parse the AI response as JSON
    let suggestedSkills;
    try {
      suggestedSkills = JSON.parse(aiResponse.response.trim());
    } catch (parseError) {
      // If JSON parsing fails, try to extract skills from text
      const skillMatches = aiResponse.response.match(/"([^"]+)"/g);
      if (skillMatches) {
        suggestedSkills = skillMatches.map(match => ({
          name: match.replace(/"/g, '')
        }));
      } else {
        // Fallback: split by common delimiters
        suggestedSkills = aiResponse.response
          .split(/[,\n\-•]/)
          .map(skill => ({ name: skill.trim() }))
          .filter(skill => skill.name.length > 0)
          .slice(0, 12);
      }
    }

    // Merge with existing skills, avoiding duplicates
    const existingSkillNames = context.currentSkills.map(s => (s.name || s).toLowerCase());
    const newSkills = suggestedSkills.filter(skill => 
      !existingSkillNames.includes(skill.name.toLowerCase())
    );

    const allSkills = [...context.currentSkills, ...newSkills];

    res.json({
      success: true,
      data: {
        skills: allSkills
      }
    });

  } catch (error) {
    console.error('Error generating AI skills:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Generate AI content based on type
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { type, data } = req.body;

    if (!type || !data) {
      return res.status(400).json({
        success: false,
        error: 'Type and data are required'
      });
    }

    let prompt = '';
    let systemMessage = '';

    switch (type) {
      case 'project_description':
        systemMessage = 'You are a technical writer specializing in project descriptions for resumes.';
        prompt = `Write a compelling project description for "${data.title}".

Requirements:
- 2-3 sentences maximum
- Focus on technical implementation and impact
- Highlight key features and technologies used
- Make it professional and achievement-focused
- Avoid generic phrases
- Write in past tense

Return only the project description text, no additional formatting.`;
        break;

      case 'career_objective':
        systemMessage = 'You are a career counselor writing career objectives for resumes.';
        prompt = `Write a compelling career objective for a professional.

Context: ${JSON.stringify(data)}

Requirements:
- 1-2 sentences maximum
- Focus on career goals and value proposition
- Make it specific and professional
- Avoid generic phrases

Return only the career objective text, no additional formatting.`;
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Unsupported generation type'
        });
    }

    const aiResponse = await groqService.generateResponse(
      systemMessage,
      prompt,
      {
        temperature: 0.7,
        maxTokens: 150
      }
    );
    
    if (!aiResponse?.response) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate AI content'
      });
    }

    res.json({
      success: true,
      data: aiResponse.response.trim()
    });

  } catch (error) {
    console.error('Error generating AI content:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;